package com.taiz.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.taiz.platform.media.Media3Plugin;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(Media3Plugin.class);
        try {
            FirebaseApp.initializeApp(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.onCreate(savedInstanceState);
    }
}

