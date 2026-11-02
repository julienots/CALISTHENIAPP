package com.gravitas.calisthenics;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.widget.RemoteViews;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Widget « Ma semaine » : 7 jours, la série en cours, et la séance du jour à valider en un geste.
 * Tout est local : l'appli envoie la liste des jours entraînés / de repos, le widget calcule la
 * semaine lui-même (il reste juste après minuit sans rouvrir l'appli). « Valider » et « Repos »
 * fonctionnent sans ouvrir l'appli : l'action est mise en attente puis appliquée au prochain lancement.
 */
public class GravitasWidget extends AppWidgetProvider {
    static final String PREFS = "gravitas_widget";
    static final String ACTION_DONE = "com.gravitas.calisthenics.WIDGET_DONE";
    static final String ACTION_REST = "com.gravitas.calisthenics.WIDGET_REST";
    static final String ACTION_TICK = "com.gravitas.calisthenics.WIDGET_TICK";

    private static final int[] DAY_IDS = {R.id.day0, R.id.day1, R.id.day2, R.id.day3, R.id.day4, R.id.day5, R.id.day6};
    private static final int[] LBL_IDS = {R.id.lbl0, R.id.lbl1, R.id.lbl2, R.id.lbl3, R.id.lbl4, R.id.lbl5, R.id.lbl6};
    private static final String[] LABELS = {"L", "M", "M", "J", "V", "S", "D"};

    static String key(Calendar c) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(c.getTime());
    }

    static Set<String> readSet(SharedPreferences p, String name) {
        return new HashSet<>(p.getStringSet(name, new HashSet<String>()));
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
        scheduleMidnight(ctx);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        if (a == null) return;
        if (ACTION_DONE.equals(a) || ACTION_REST.equals(a)) {
            SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String today = key(Calendar.getInstance());
            Set<String>[] st = loadDays(p);
            boolean done = ACTION_DONE.equals(a);
            if (done) {
                if (!st[0].contains(today)) {
                    Set<String> pend = readSet(p, "pending_done");
                    pend.add(today);
                    p.edit().putStringSet("pending_done", pend).apply();
                }
                Toast.makeText(ctx, "Séance du jour validée ✓", Toast.LENGTH_SHORT).show();
            } else {
                if (st[0].contains(today)) {
                    Toast.makeText(ctx, "Séance déjà validée aujourd'hui", Toast.LENGTH_SHORT).show();
                    return;
                }
                Set<String> pend = readSet(p, "pending_rest");
                pend.add(today);
                p.edit().putStringSet("pending_rest", pend).apply();
                Toast.makeText(ctx, "Jour de repos noté", Toast.LENGTH_SHORT).show();
            }
            refresh(ctx);
        } else if (ACTION_TICK.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)) {
            refresh(ctx);
        }
    }

    /** Rafraîchit toutes les instances du widget. */
    static void refresh(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, GravitasWidget.class));
        if (ids.length == 0) return;
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
        scheduleMidnight(ctx);
    }

    /** [0] = jours entraînés, [1] = jours de repos (données de l'appli + actions en attente). */
    @SuppressWarnings("unchecked")
    static Set<String>[] loadDays(SharedPreferences p) {
        Set<String> done = new HashSet<>();
        Set<String> rest = new HashSet<>();
        try {
            JSONObject o = new JSONObject(p.getString("data", "{}"));
            JSONArray d = o.optJSONArray("done");
            JSONArray r = o.optJSONArray("rest");
            if (d != null) for (int i = 0; i < d.length(); i++) done.add(d.getString(i));
            if (r != null) for (int i = 0; i < r.length(); i++) rest.add(r.getString(i));
        } catch (Exception ignored) {
        }
        done.addAll(readSet(p, "pending_done"));
        rest.addAll(readSet(p, "pending_rest"));
        rest.removeAll(done);
        return new Set[]{done, rest};
    }

    static RemoteViews build(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_gravitas);
        Set<String>[] st = loadDays(p);
        Set<String> done = st[0];
        Set<String> rest = st[1];
        String next = "Séance libre";
        int minutes = 0;
        boolean hasData = p.contains("data");
        try {
            JSONObject o = new JSONObject(p.getString("data", "{}"));
            next = o.optString("next", next);
            minutes = o.optInt("minutes", 0);
        } catch (Exception ignored) {
        }

        Calendar now = Calendar.getInstance();
        String today = key(now);
        Calendar c = (Calendar) now.clone();
        int offset = (c.get(Calendar.DAY_OF_WEEK) + 5) % 7; // lundi = 0
        c.add(Calendar.DAY_OF_MONTH, -offset);
        int week = 0;
        for (int i = 0; i < 7; i++) {
            String k = key(c);
            boolean isToday = k.equals(today);
            int bg;
            int fg = Color.WHITE;
            String txt = String.valueOf(c.get(Calendar.DAY_OF_MONTH));
            if (done.contains(k)) {
                bg = isToday ? R.drawable.widget_day_done_today : R.drawable.widget_day_done;
                fg = 0xFF1A0B04;
                txt = "✓";
                week++;
            } else if (rest.contains(k)) {
                bg = isToday ? R.drawable.widget_day_rest_today : R.drawable.widget_day_rest;
                fg = 0xFF1A0B04;
            } else if (isToday) {
                bg = R.drawable.widget_day_todo;
            } else if (k.compareTo(today) > 0) {
                bg = R.drawable.widget_day_future;
                fg = 0x80FFFFFF;
            } else {
                bg = R.drawable.widget_day_miss;
                fg = 0xFFFF6B5E;
                txt = "✕";
            }
            v.setInt(DAY_IDS[i], "setBackgroundResource", bg);
            v.setTextViewText(DAY_IDS[i], txt);
            v.setTextColor(DAY_IDS[i], fg);
            v.setTextViewText(LBL_IDS[i], LABELS[i]);
            v.setTextColor(LBL_IDS[i], isToday ? 0xFFFF7A1A : 0x99FFFFFF);
            c.add(Calendar.DAY_OF_MONTH, 1);
        }

        // Série : comme dans l'appli, active tant qu'il n'y a pas plus de 2 jours sans séance d'affilée.
        int streak = 0, gap = 0;
        Calendar s = (Calendar) now.clone();
        for (int i = 0; i < 365; i++) {
            if (done.contains(key(s))) {
                streak++;
                gap = 0;
            } else if (++gap > 2) break;
            s.add(Calendar.DAY_OF_MONTH, -1);
        }
        v.setTextViewText(R.id.streak, "🔥 " + streak);
        v.setTextViewText(R.id.week, week + "/7 cette semaine");

        boolean doneToday = done.contains(today);
        boolean restToday = rest.contains(today);
        String line;
        if (!hasData) line = "Ouvre GRAVITAS une fois pour lier le widget";
        else if (doneToday) line = "Séance du jour validée ✓";
        else if (restToday) line = "Jour de repos · récupère bien";
        else line = "Aujourd'hui : " + next + (minutes > 0 ? " · " + minutes + " min" : "");
        v.setTextViewText(R.id.line, line);

        if (doneToday) {
            v.setTextViewText(R.id.btn_done, "Détailler");
            v.setOnClickPendingIntent(R.id.btn_done, open(ctx, "done", 1));
        } else {
            v.setTextViewText(R.id.btn_done, "✓ Valider");
            v.setOnClickPendingIntent(R.id.btn_done, hasData ? broadcast(ctx, ACTION_DONE, 2) : open(ctx, "done", 1));
        }
        v.setOnClickPendingIntent(R.id.btn_log, open(ctx, "log", 3));
        v.setTextViewText(R.id.btn_rest, restToday ? "🌙 Repos" : "Repos");
        v.setOnClickPendingIntent(R.id.btn_rest, hasData ? broadcast(ctx, ACTION_REST, 4) : open(ctx, "rest", 5));
        v.setOnClickPendingIntent(R.id.widget_root, open(ctx, "calendar", 6));
        return v;
    }

    static PendingIntent open(Context ctx, String action, int code) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("gravitas://" + action), ctx, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent broadcast(Context ctx, String action, int code) {
        Intent i = new Intent(ctx, GravitasWidget.class).setAction(action);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Réveil (non exact, sans permission spéciale) juste après minuit pour passer au jour suivant. */
    static void scheduleMidnight(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar m = Calendar.getInstance();
        m.add(Calendar.DAY_OF_MONTH, 1);
        m.set(Calendar.HOUR_OF_DAY, 0);
        m.set(Calendar.MINUTE, 1);
        m.set(Calendar.SECOND, 0);
        am.set(AlarmManager.RTC, m.getTimeInMillis(), broadcast(ctx, ACTION_TICK, 7));
    }
}
