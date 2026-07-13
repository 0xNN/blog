import { motion, useReducedMotion } from "framer-motion";

/**
 * One shared motion language: a quiet fade + slight rise as content enters view.
 * Respects prefers-reduced-motion (renders static).
 */
export default function Reveal({ children, delay = 0, y = 18, className, as = "div" }) {
    const reduce = useReducedMotion();
    const MotionTag = motion[as] || motion.div;

    if (reduce) {
        const Tag = as;
        return <Tag className={className}>{children}</Tag>;
    }

    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </MotionTag>
    );
}
