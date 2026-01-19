import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { signInWithGithub } = useAuthStore();

    const handleLogin = async () => {
        try {
            await signInWithGithub();
            // OAuth redirect will happen, no need to close manually implies reload
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-bg-secondary border border-border-subtle shadow-xl text-center"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    >
                        <div className="p-8 flex flex-col items-center gap-6">

                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-text-primary">
                                    Sync with Cloud
                                </h2>
                                <p className="text-sm text-text-muted">
                                    Sign in to synchronize your tasks across devices and keep your data safe.
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleLogin}
                                className="w-full justify-center"
                            >
                                Continue with GitHub
                            </Button>

                            <button
                                onClick={onClose}
                                className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
                            >
                                Stay offline for now
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
