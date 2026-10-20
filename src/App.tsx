import { useEffect, useState, useCallback } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/splash-screen";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Light from "@/pages/light";
import VibeWriter from "@/pages/vibe";
import Logbuch from "@/pages/logbuch";
import Ausfluege from "@/pages/ausfluege";
import Guachinches from "@/pages/guachinches";
import Karte from "@/pages/karte";
import Mehr from "@/pages/mehr";
import Slideshow from "@/pages/slideshow";
import Tagesplaner from "@/pages/tagesplaner";
import Richtung from "@/pages/richtung";
import NotFound from "@/pages/not-found";
import { startQueueProcessor } from "@/lib/offline-queue";
import { applyAstroModeClass } from "@/lib/astro-mode";
import { startGeoTrackingWennErlaubt } from "@/lib/visited";
import { SPOTS } from "@/data/spots";
import { registerServiceWorker, startScheduler } from "@/lib/notifications";
import { buildEvents } from "@/lib/events";
import { useKeepAlive } from "@/lib/keep-alive";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Karte is the landing screen */}
        <Route path="/" component={Karte} />
        <Route path="/karte" component={Karte} />
        {/* Heute still accessible via nav */}
        <Route path="/heute" component={Dashboard} />
        <Route path="/light" component={Light} />
        <Route path="/vibe" component={VibeWriter} />
        <Route path="/logbuch" component={Logbuch} />
        <Route path="/logbuch/:id" component={Logbuch} />
        <Route path="/ausfluege" component={Ausfluege} />
        <Route path="/guachinches" component={Guachinches} />
        <Route path="/mehr" component={Mehr} />
        <Route path="/slideshow" component={Slideshow} />
        <Route path="/tagesplaner" component={Tagesplaner} />
        <Route path="/richtung" component={Richtung} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useKeepAlive(); // Wake Lock + API ping — controlled via Mehr toggle
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  useEffect(() => { applyAstroModeClass(); }, []);

  useEffect(() => {
    const stopQueue = startQueueProcessor();
    const stopGeo = startGeoTrackingWennErlaubt(SPOTS.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })));
    void registerServiceWorker(import.meta.env.BASE_URL);
    const stopScheduler = startScheduler(() => buildEvents());
    return () => {
      stopQueue();
      stopGeo();
      stopScheduler();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <AnimatePresence>
          {showSplash && <SplashScreen onDone={handleSplashDone} />}
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
