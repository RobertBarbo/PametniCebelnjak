package si.pametnicebelnjak.app;

import android.Manifest;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.WifiNetworkSpecifier;
import android.os.Build;
import android.os.PatternMatcher;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "ProvisioningWifi",
    permissions = {
        @Permission(alias = "nearbyWifi", strings = { Manifest.permission.NEARBY_WIFI_DEVICES }),
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION })
    }
)
public class ProvisioningWifiPlugin extends Plugin {

    private static final String DEVICE_AP_PREFIX = "Cebelnjak-";
    private static final String DEVICE_BASE_URL = "http://192.168.4.1";
    private static final int NETWORK_REQUEST_TIMEOUT_MS = 30_000;
    private static final int HTTP_CONNECT_TIMEOUT_MS = 5_000;
    private static final int HTTP_READ_TIMEOUT_MS = 8_000;

    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private volatile Network deviceNetwork;

    @Override
    public void load() {
        connectivityManager = (ConnectivityManager) getContext().getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String permissionAlias = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "nearbyWifi" : "location";
        if (getPermissionState(permissionAlias) != PermissionState.GRANTED) {
            requestPermissionForAlias(permissionAlias, call, "connectAfterPermission");
            return;
        }
        requestDeviceNetwork(call);
    }

    @PermissionCallback
    private void connectAfterPermission(PluginCall call) {
        String permissionAlias = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "nearbyWifi" : "location";
        if (getPermissionState(permissionAlias) != PermissionState.GRANTED) {
            call.reject("Dovoljenje za povezovanje z bližnjo napravo ni bilo odobreno.");
            return;
        }
        requestDeviceNetwork(call);
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        releaseDeviceNetwork();
        call.resolve();
    }

    @PluginMethod
    public void openWifiSettings(PluginCall call) {
        try {
            Intent intent = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? new Intent(Settings.Panel.ACTION_WIFI)
                : new Intent(Settings.ACTION_WIFI_SETTINGS);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (RuntimeException exception) {
            call.reject("Android ni mogel odpreti nastavitev Wi-Fi omrežja.", exception);
        }
    }

    @PluginMethod
    public void openLocalDashboard(PluginCall call) {
        Network network = deviceNetwork;
        if (network == null) {
            call.reject("Aplikacija ni povezana z dostopno točko naprave.");
            return;
        }

        if (!connectivityManager.bindProcessToNetwork(network)) {
            call.reject("Lokalne nadzorne plošče ni bilo mogoče odpreti.");
            return;
        }

        JSObject result = new JSObject();
        result.put("url", DEVICE_BASE_URL + "/");
        call.resolve(result);
    }

    @PluginMethod
    public void closeLocalDashboard(PluginCall call) {
        if (connectivityManager != null) {
            connectivityManager.bindProcessToNetwork(null);
        }
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        executeHttpRequest(call, "GET", "/api/status", null);
    }

    @PluginMethod
    public void scanNetworks(PluginCall call) {
        executeHttpRequest(call, "GET", "/api/wifi/networks", null);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        String ssid = call.getString("ssid", "").trim();
        String password = call.getString("password", "");
        if (ssid.isEmpty()) {
            call.reject("Ime Wi-Fi omrežja manjka.");
            return;
        }

        String body = "ssid=" + urlEncode(ssid) + "&password=" + urlEncode(password);
        executeHttpRequest(call, "POST", "/api/wifi", body);
    }

    private void requestDeviceNetwork(PluginCall call) {
        releaseDeviceNetwork();

        WifiNetworkSpecifier specifier = new WifiNetworkSpecifier.Builder()
            .setSsidPattern(new PatternMatcher(DEVICE_AP_PREFIX, PatternMatcher.PATTERN_PREFIX))
            .build();

        NetworkRequest request = new NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .removeCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .setNetworkSpecifier(specifier)
            .build();

        networkCallback = new ConnectivityManager.NetworkCallback() {
            private boolean settled;

            @Override
            public void onAvailable(Network network) {
                if (settled) return;
                settled = true;
                deviceNetwork = network;
                JSObject result = new JSObject();
                result.put("connected", true);
                call.resolve(result);
            }

            @Override
            public void onUnavailable() {
                if (settled) return;
                settled = true;
                deviceNetwork = null;
                networkCallback = null;
                call.reject("Dostopna točka naprave ni bila izbrana ali ni dosegljiva.");
            }

            @Override
            public void onLost(Network network) {
                if (network.equals(deviceNetwork)) {
                    deviceNetwork = null;
                }
            }
        };

        try {
            connectivityManager.requestNetwork(request, networkCallback, NETWORK_REQUEST_TIMEOUT_MS);
        } catch (RuntimeException exception) {
            releaseDeviceNetwork();
            call.reject("Android ni mogel odpreti izbire Wi-Fi omrežja.", exception);
        }
    }

    private void executeHttpRequest(PluginCall call, String method, String path, String requestBody) {
        Network network = deviceNetwork;
        if (network == null) {
            call.reject("Aplikacija ni povezana z dostopno točko naprave.");
            return;
        }

        ioExecutor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(DEVICE_BASE_URL + path);
                connection = (HttpURLConnection) network.openConnection(url);
                connection.setRequestMethod(method);
                connection.setConnectTimeout(HTTP_CONNECT_TIMEOUT_MS);
                connection.setReadTimeout(HTTP_READ_TIMEOUT_MS);
                connection.setUseCaches(false);
                connection.setRequestProperty("Accept", "application/json");
                connection.setRequestProperty("Connection", "close");

                if (requestBody != null) {
                    byte[] requestBytes = requestBody.getBytes(StandardCharsets.UTF_8);
                    connection.setDoOutput(true);
                    connection.setFixedLengthStreamingMode(requestBytes.length);
                    connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                    try (OutputStream output = connection.getOutputStream()) {
                        output.write(requestBytes);
                    }
                }

                int statusCode = connection.getResponseCode();
                String responseBody = readResponseBody(connection, statusCode);
                JSObject result = new JSObject();
                result.put("statusCode", statusCode);
                result.put("body", responseBody);
                call.resolve(result);
            } catch (IOException exception) {
                call.reject("Naprava se prek lokalne povezave ni odzvala.", exception);
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private String readResponseBody(HttpURLConnection connection, int statusCode) throws IOException {
        InputStream stream = statusCode >= 400 ? connection.getErrorStream() : connection.getInputStream();
        if (stream == null) return "";

        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
        }
        return body.toString();
    }

    private String urlEncode(String value) {
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException exception) {
            throw new IllegalStateException("UTF-8 encoding is unavailable.", exception);
        }
    }

    private void releaseDeviceNetwork() {
        if (connectivityManager != null) {
            connectivityManager.bindProcessToNetwork(null);
        }
        deviceNetwork = null;
        if (connectivityManager != null && networkCallback != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            } catch (IllegalArgumentException ignored) {
                // Callback je Android lahko že sam zaključil po timeoutu.
            }
        }
        networkCallback = null;
    }

    @Override
    protected void handleOnDestroy() {
        releaseDeviceNetwork();
        ioExecutor.shutdownNow();
        super.handleOnDestroy();
    }
}
