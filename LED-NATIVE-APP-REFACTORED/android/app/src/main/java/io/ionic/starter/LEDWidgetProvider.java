package io.ionic.starter;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.net.Uri;

/**
 * LED Control Widget für Homescreen
 * Schnellzugriff auf häufige LED-Aktionen
 */
public class LEDWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_LED_ON = "io.ionic.starter.LED_ON";
    private static final String ACTION_LED_OFF = "io.ionic.starter.LED_OFF";
    private static final String ACTION_COLOR_RED = "io.ionic.starter.COLOR_RED";
    private static final String ACTION_COLOR_GREEN = "io.ionic.starter.COLOR_GREEN";
    private static final String ACTION_COLOR_BLUE = "io.ionic.starter.COLOR_BLUE";
    private static final String ACTION_PARTY = "io.ionic.starter.PARTY";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_led_control);

        // LED An Button
        Intent ledOnIntent = new Intent(context, MainActivity.class);
        ledOnIntent.setData(Uri.parse("ledcontrol://action/led_on"));
        ledOnIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent ledOnPending = PendingIntent.getActivity(context, 0, ledOnIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_led_on, ledOnPending);

        // LED Aus Button
        Intent ledOffIntent = new Intent(context, MainActivity.class);
        ledOffIntent.setData(Uri.parse("ledcontrol://action/led_off"));
        ledOffIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent ledOffPending = PendingIntent.getActivity(context, 1, ledOffIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_led_off, ledOffPending);

        // Rot Button
        Intent redIntent = new Intent(context, MainActivity.class);
        redIntent.setData(Uri.parse("ledcontrol://action/color_red"));
        redIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent redPending = PendingIntent.getActivity(context, 2, redIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_color_red, redPending);

        // Grün Button
        Intent greenIntent = new Intent(context, MainActivity.class);
        greenIntent.setData(Uri.parse("ledcontrol://action/color_green"));
        greenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent greenPending = PendingIntent.getActivity(context, 3, greenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_color_green, greenPending);

        // Blau Button
        Intent blueIntent = new Intent(context, MainActivity.class);
        blueIntent.setData(Uri.parse("ledcontrol://action/color_blue"));
        blueIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent bluePending = PendingIntent.getActivity(context, 4, blueIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_color_blue, bluePending);

        // Party Button
        Intent partyIntent = new Intent(context, MainActivity.class);
        partyIntent.setData(Uri.parse("ledcontrol://action/party_mode"));
        partyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent partyPending = PendingIntent.getActivity(context, 5, partyIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_party, partyPending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
    }
}
