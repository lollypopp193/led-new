export default [{
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
            // Browser globals
            window: "readonly",
            document: "readonly",
            console: "readonly",
            alert: "readonly",
            confirm: "readonly",
            navigator: "readonly",
            localStorage: "readonly",
            sessionStorage: "readonly",
            fetch: "readonly",
            setTimeout: "readonly",
            setInterval: "readonly",
            clearTimeout: "readonly",
            clearInterval: "readonly",
            // Service Worker globals
            self: "readonly",
            caches: "readonly",
            clients: "readonly",
            registration: "readonly",
            // DOM globals
            HTMLElement: "readonly",
            Event: "readonly",
            CustomEvent: "readonly",
            MouseEvent: "readonly",
            KeyboardEvent: "readonly",
            // Other common globals
            WebSocket: "readonly",
            Audio: "readonly",
            Image: "readonly",
            FormData: "readonly",
            FileReader: "readonly",
            Blob: "readonly",
            URL: "readonly",
            URLSearchParams: "readonly",
            Response: "readonly",
            Request: "readonly"
        }
    },
    rules: {
        "no-unused-vars": "warn",
        "no-undef": "warn",
        "no-console": "off"
    }
}];