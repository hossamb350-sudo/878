package com.taiz.platform;

import android.content.Intent;
import android.os.Bundle;
import java.io.File;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Instantly setup the crash logger to catch any initialization errors
        CrashLogger.setupExceptionHandler(this);
        
        // 2. NATIVE BYPASS: Check if a crash log exists from a previous run.
        // If it does, we show the CrashDisplayActivity and STOP MainActivity
        // before WebView, Capacitor, or any Plugins even begin to initialize.
        File crashFile = new File(getFilesDir(), "last_crash.txt");
        if (crashFile.exists() && crashFile.length() > 0) {
            Intent intent = new Intent(this, CrashDisplayActivity.class);
            startActivity(intent);
            finish(); // Kill MainActivity completely so it doesn't crash again
            return;   // DO NOT call super.onCreate!
        }
        
        // 3. Normal startup (only runs if there is no crash file)
        registerPlugin(RadioPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
