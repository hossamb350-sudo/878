#!/bin/bash
sed -i 's/import { getMessaging } from "firebase-admin\/messaging";/import { getMessaging } from "firebase-admin\/messaging";\nimport { getAuth } from "firebase-admin\/auth";/' server.ts
