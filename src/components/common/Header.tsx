import { motion } from "framer-motion";
import adaptiveIcon from "@/assets/images/adaptive-icon.png";

export function Header() {
    return (
        <header className="absolute left-0 right-0 top-0 z-50 flex justify-center py-6">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1 shadow-xl backdrop-blur-md">
                    <img src={adaptiveIcon} alt="Aerlot logo" className="h-full w-full object-cover" />
                </div>
            </motion.div>
        </header>
    );
}
