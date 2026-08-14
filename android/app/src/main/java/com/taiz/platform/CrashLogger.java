package com.taiz.platform;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.util.Log;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

public class CrashLogger {
    private static final String CRASH_FILE_NAME = "last_crash.txt";

    public static void setupExceptionHandler(final Activity activity) {
        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable throwable) {
                try {
                    File crashFile = new File(activity.getFilesDir(), CRASH_FILE_NAME);
                    FileWriter fw = new FileWriter(crashFile);
                    fw.write("Thread: " + thread.getName() + "\n");
                    fw.write("Exception: " + throwable.toString() + "\n");
                    
                    StringWriter sw = new StringWriter();
                    PrintWriter pw = new PrintWriter(sw);
                    throwable.printStackTrace(pw);
                    fw.write(sw.toString());
                    
                    Throwable cause = throwable.getCause();
                    if (cause != null) {
                        fw.write("\nCaused by:\n");
                        cause.printStackTrace(pw);
                        // The printStackTrace above already prints the stack, 
                        // but StringWriter captures it for writing.
                    }
                    
                    fw.flush();
                    fw.close();
                } catch (Exception e) {
                    Log.e("CrashLogger", "Failed to write crash log", e);
                }
                
                // Let the app crash naturally so Android knows it crashed
                if (defaultHandler != null) {
                    defaultHandler.uncaughtException(thread, throwable);
                } else {
                    System.exit(1);
                }
            }
        });
    }

    public static void checkForPreviousCrash(final Activity activity) {
        final File crashFile = new File(activity.getFilesDir(), CRASH_FILE_NAME);
        if (crashFile.exists()) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new FileReader(crashFile))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append("\n");
                }
            } catch (IOException e) {
                sb.append("Error reading crash file: ").append(e.getMessage());
            }

            if (sb.length() > 0) {
                ScrollView scrollView = new ScrollView(activity);
                TextView textView = new TextView(activity);
                textView.setText(sb.toString());
                textView.setPadding(32, 32, 32, 32);
                textView.setTextSize(12);
                textView.setTextIsSelectable(true); // Allow copying from the device!
                scrollView.addView(textView);

                new AlertDialog.Builder(activity)
                        .setTitle("Previous Crash Detected")
                        .setView(scrollView)
                        .setPositiveButton("Clear Log & Close", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                crashFile.delete();
                                dialog.dismiss();
                            }
                        })
                        .setCancelable(false)
                        .show();
            }
        }
    }
}
