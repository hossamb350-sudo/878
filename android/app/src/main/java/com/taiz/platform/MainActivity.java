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
        
        // 2. Check if a crash log exists from a previous run.
        File crashFile = new File(getFilesDir(), "last_crash.txt");
        if (crashFile.exists() && crashFile.length() > 0) {
            // We MUST call super.onCreate() to satisfy Android's lifecycle requirements,
            // otherwise it throws SuperNotCalledException.
            super.onCreate(savedInstanceState);
            
            // Launch the crash display activity
            Intent intent = new Intent(this, CrashDisplayActivity.class);
            startActivity(intent);
            
            // Finish this activity so we don't proceed with normal app execution
            finish();
            return;
        }
        
        // 3. Normal startup (only runs if there is no crash file)
        registerPlugin(RadioPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
