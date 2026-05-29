import { motion } from "framer-motion";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-white/5 pb-12 pt-8 text-center">
            <div className="mx-auto max-w-5xl px-5">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-4 text-sm text-muted-foreground"
                >
                    <p>© {currentYear} Plutoid Technologies Limited.</p>
                    <div className="flex gap-4">
                        <a
                            href="https://aerlotapp.github.io/AerlotMessengerPrivacyPolicy/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-foreground"
                        >
                            Privacy Policy
                        </a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
