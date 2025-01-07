import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { CenteredLoader } from "./components/Loader";
import { EmailProvider } from "./context/EmailContext";
const Popup = React.lazy(() => import("./components/index"));
import "./index.css";

function init() {
  const appContainer = document.createElement("div");
  document.body.appendChild(appContainer);
  if (!appContainer) {
    throw new Error("Can not find AppContainer");
  }
  const root = createRoot(appContainer);
  root.render(
    <EmailProvider>
      <Suspense fallback={<CenteredLoader />}>
        <Popup />
      </Suspense>
    </EmailProvider>
  );
}

init();
