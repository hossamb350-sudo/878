package com.taiz.platform;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class CrashDisplayActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(32, 64, 32, 32);

        Button copyBtn = new Button(this);
        copyBtn.setText("1. COPY FULL LOG TO CLIPBOARD");
        
        Button clearBtn = new Button(this);
        clearBtn.setText("2. CLEAR LOG AND EXIT");

        ScrollView scrollView = new ScrollView(this);
        final TextView textView = new TextView(this);
        textView.setTextSize(12);
        textView.setTextIsSelectable(true);

        final File crashFile = new File(getFilesDir(), "last_crash.txt");
        StringBuilder sb = new StringBuilder();
        if (crashFile.exists()) {
            try (BufferedReader br = new BufferedReader(new FileReader(crashFile))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append("\n");
                }
            } catch (IOException e) {
                sb.append("Error reading file: ").append(e.getMessage());
            }
        } else {
            sb.append("No crash log found.");
        }

        textView.setText(sb.toString());

        copyBtn.setOnClickListener(v -> {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("Crash Log", textView.getText());
            if (clipboard != null) {
                clipboard.setPrimaryClip(clip);
                Toast.makeText(this, "Copied to clipboard! Please paste it to the agent.", Toast.LENGTH_LONG).show();
            }
        });

        clearBtn.setOnClickListener(v -> {
            crashFile.delete();
            finishAffinity();
            System.exit(0);
        });

        layout.addView(copyBtn);
        layout.addView(clearBtn);
        scrollView.addView(textView);
        layout.addView(scrollView);

        setContentView(layout);
    }
}
