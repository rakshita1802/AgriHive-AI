// ---------------- shared React hook aliases ----------------
// Declared once here; every subsequent <script type="text/babel"> tag
// shares this same top-level lexical scope, so useState/useEffect/etc.
// are available directly in every component file below.
const { useState, useEffect, useCallback, useMemo, useRef } = React;
const DEFAULT_API = "http://localhost:8001";
