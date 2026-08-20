package si.pametnicebelnjak.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ProvisioningWifiPlugin.class);
        super.onCreate(savedInstanceState);
        configureSystemBars();
        applySystemBarInsetsToDashboard();
    }

    private void configureSystemBars() {
        final Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.getInsetsController().setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                            | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        } else {
            window.getDecorView().setSystemUiVisibility(0);
        }
    }

    private void applySystemBarInsetsToDashboard() {
        final WebView webView = getBridge().getWebView();
        // Cloud nadzorna plošča je v istem WebViewu kot nativni provisioning pogled.
        // Sistemskih robov WebView ne pretvori zanesljivo v CSS safe-area spremenljivke,
        // zato zamaknemo njegov vsebnik, da je ne prekrijeta ura in Android navigacija.
        final View webViewContainer = (View) webView.getParent();
        webViewContainer.setOnApplyWindowInsetsListener((view, windowInsets) -> {
            final int left = windowInsets.getSystemWindowInsetLeft();
            final int top = windowInsets.getSystemWindowInsetTop();
            final int right = windowInsets.getSystemWindowInsetRight();
            final int bottom = windowInsets.getSystemWindowInsetBottom();
            view.setPadding(left, top, right, bottom);
            return windowInsets;
        });
        webViewContainer.requestApplyInsets();
    }
}
