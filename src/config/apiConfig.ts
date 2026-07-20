import { Capacitor } from "@capacitor/core";

const isProd = import.meta.env.PROD;
const DEV_URL = "https://ais-dev-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";
const PROD_URL = "https://ais-pre-oci535fuagpr75jdwcw57v-955809935515.europe-west2.run.app";

export const API_BASE = Capacitor.isNativePlatform() ? (isProd ? PROD_URL : DEV_URL) : "";
