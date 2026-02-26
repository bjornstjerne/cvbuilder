/**
 * CV Optima Authentication Manager
 * Handles user login, signup, and session management using Firebase.
 */

// --- FIREBASE CONFIGURATION ---
// IMPORTANT: Replace the placeholder below with your Firebase project configuration
// You can find this in your Firebase Console: Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Only initialize if config is provided
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
}

class AuthManager {
    constructor() {
        this.user = null;
        this.listeners = [];
        const hasFirebaseSdk = typeof firebase !== 'undefined';
        this.mockMode = !hasFirebaseSdk || firebaseConfig.apiKey === "YOUR_API_KEY";
        this.auth = this.mockMode ? null : firebase.auth();

        if (this.mockMode) {
            console.warn('Firebase config not found. Running in MOCK MODE.');
        }

        this.init();
    }

    init() {
        if (this.mockMode) {
            const savedUser = localStorage.getItem('mock_user');
            if (savedUser) {
                this.user = JSON.parse(savedUser);
                this.notifyListeners();
            }
        } else {
            // Real Firebase Auth observer
            this.auth.onAuthStateChanged((user) => {
                this.user = user;
                this.notifyListeners();
            });
        }
    }

    /**
     * Subscribe to auth state changes
     * @param {Function} callback - Function to call when auth state changes
     */
    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        // Immediate callback with current state
        callback(this.user);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.user));
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        if (this.mockMode) {
            await new Promise(resolve => setTimeout(resolve, 800));
            this.user = {
                uid: 'mock-google-user-123',
                displayName: 'Bjørnstjerne Bechmann',
                email: 'user@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=Bjørnstjerne+Bechmann&background=0D9488&color=fff',
                provider: 'google'
            };
            localStorage.setItem('mock_user', JSON.stringify(this.user));
            this.notifyListeners();
            return { user: this.user };
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await this.auth.signInWithPopup(provider);
            return result;
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    }

    /**
     * Sign in with Email and Password
     */
    async signInWithEmail(email, password) {
        if (this.mockMode) {
            await new Promise(resolve => setTimeout(resolve, 800));
            this.user = {
                uid: 'mock-email-user-456',
                displayName: email.split('@')[0],
                email: email,
                photoURL: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
                provider: 'email'
            };
            localStorage.setItem('mock_user', JSON.stringify(this.user));
            this.notifyListeners();
            return { user: this.user };
        }

        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return result;
        } catch (error) {
            console.error("Email Sign-In Error:", error);
            throw error;
        }
    }

    /**
     * Sign Up with Email and Password
     */
    async signUpWithEmail(email, password, name) {
        if (this.mockMode) {
            await new Promise(resolve => setTimeout(resolve, 800));
            this.user = {
                uid: 'mock-new-user-789',
                displayName: name || email.split('@')[0],
                email: email,
                photoURL: `https://ui-avatars.com/api/?name=${name || email}&background=random`,
                provider: 'email'
            };
            localStorage.setItem('mock_user', JSON.stringify(this.user));
            this.notifyListeners();
            return { user: this.user };
        }

        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            if (name && result.user) {
                await result.user.updateProfile({ displayName: name });
            }
            return result;
        } catch (error) {
            console.error("Sign-Up Error:", error);
            throw error;
        }
    }

    /**
     * Sign Out
     */
    async signOut() {
        if (this.mockMode) {
            await new Promise(resolve => setTimeout(resolve, 400));
            this.user = null;
            localStorage.removeItem('mock_user');
            this.notifyListeners();
            return;
        }

        try {
            await this.auth.signOut();
        } catch (error) {
            console.error("Sign-Out Error:", error);
            throw error;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }
}
