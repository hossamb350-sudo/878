package com.taiz.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.taiz.platform.media.Media3Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(Media3Plugin.class);
        super.onCreate(savedInstanceState);
    }
}

