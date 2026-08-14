package com.taiz.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Instantly setup the crash logger to catch any initialization errors
        CrashLogger.setupExceptionHandler(this);
        
        registerPlugin(RadioPlugin.class);
        super.onCreate(savedInstanceState);
        
        // 2. Check and display any crash from the previous run natively
        CrashLogger.checkForPreviousCrash(this);
    }
}
