import "./index.css";
import React, { Suspense } from "react";
import { App } from "@/components";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { WalletSelectorModal } from "@/components/modals/wallet";
import Buffer from "node:buffer";
import "react-toastify/dist/ReactToastify.css";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { useEnv } from "@/hooks/useEnv";

const TRACE_SAMPLE_RATE = useEnv("VITE_TRACES_SAMPLE_RATE");
const SENTRY_DSN = useEnv("VITE_SENTRY_DSN");

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  tracesSampleRate: TRACE_SAMPLE_RATE,
});

// TODO: Find a better way to handle this buffer error
window.Buffer = window.Buffer || Buffer;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <Suspense fallback={<p>Loading...</p>}>
      <App />
    </Suspense>
    <ToastContainer
      className="toast-position"
      position="bottom-right"
      toastClassName={() =>
        "relative flex items-center bg-white w-[450px] p-6 rounded-[20px]"
      }
      bodyClassName={() =>
        "text-sm font-black font-md block w-full flex items-center"
      }
      limit={1}
      pauseOnHover={false}
      hideProgressBar={true}
      pauseOnFocusLoss={false}
    />
    <WalletSelectorModal />
  </React.Fragment>
);
