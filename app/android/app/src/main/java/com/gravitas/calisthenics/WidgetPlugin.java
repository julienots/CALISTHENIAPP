package com.gravitas.calisthenics;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Set;

/** Pont JS ↔ widget : l'appli envoie ses jours, et récupère les validations faites depuis le widget. */
@CapacitorPlugin(name = "GravitasWidget")
public class WidgetPlugin extends Plugin {
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(GravitasWidget.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void update(PluginCall call) {
        String data = call.getString("data", "{}");
        prefs().edit().putString("data", data).apply();
        GravitasWidget.refresh(getContext());
        call.resolve();
    }

    @PluginMethod
    public void consume(PluginCall call) {
        SharedPreferences p = prefs();
        Set<String> done = GravitasWidget.readSet(p, "pending_done");
        Set<String> rest = GravitasWidget.readSet(p, "pending_rest");
        p.edit().remove("pending_done").remove("pending_rest").commit();
        JSObject r = new JSObject();
        JSArray d = new JSArray();
        for (String k : done) d.put(k);
        JSArray re = new JSArray();
        for (String k : rest) re.put(k);
        r.put("done", d);
        r.put("rest", re);
        call.resolve(r);
    }
}
