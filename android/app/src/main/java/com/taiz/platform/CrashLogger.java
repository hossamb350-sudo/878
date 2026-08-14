package com.taiz.platform;

import android.app.Activity;
import android.util.Log;

import java.io.File;
import java.io.FileWriter;
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
                    
                    fw.write("=== FATAL EXCEPTION ===\n");
                    fw.write("Thread: " + thread.getName() + "\n");
                    fw.write("Exception class: " + throwable.getClass().getName() + "\n");
                    fw.write("Exception message: " + throwable.getMessage() + "\n\n");
                    fw.write("=== Stack Trace ===\n");
                    
                    StringWriter sw = new StringWriter();
                    PrintWriter pw = new PrintWriter(sw);
                    throwable.printStackTrace(pw);
                    fw.write(sw.toString());
                    
                    Throwable cause = throwable.getCause();
                    if (cause != null) {
                        fw.write("\n=== Caused by ===\n");
                        cause.printStackTrace(pw);
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
}
