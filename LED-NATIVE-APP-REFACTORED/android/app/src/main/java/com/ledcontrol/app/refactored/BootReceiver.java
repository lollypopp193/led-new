package com.ledcontrol.app.refactored;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Boot Receiver
 * Startet die App automatisch nach Geräteneustart für Auto-Connect
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (action == null)
            return;

        if (action.equals(Intent.ACTION_BOOT_COMPLETED) ||
                action.equals("android.intent.action.QUICKBOOT_POWERON")) {

            Log.d(TAG, "Boot completed - starting Bluetooth service");

            // Starte den Bluetooth Foreground Service
            Intent serviceIntent = new Intent(context, BluetoothForegroundService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
