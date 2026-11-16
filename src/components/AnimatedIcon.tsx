import { motion } from "motion/react";
import { ShoppingBag, Heart, Truck, Shield, Sparkles, Package, CreditCard } from "lucide-react";

const ICONS = { bag: ShoppingBag, heart: Heart, truck: Truck, shield: Shield, sparkle: Sparkles, package: Package, card: CreditCard };

export type AnimatedIconName = keyof typeof ICONS;

export function AnimatedIcon({ name, size = 26, className = "" }: { name: AnimatedIconName; size?: number; className?: string }) {
  const Icon = ICONS[name];

  if (name === "truck") {
    return (
      <motion.div className={className} animate={{ x: [-3, 3, -3] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        <Icon size={size} />
      </motion.div>
    );
  }
  if (name === "heart") {
    return (
      <motion.div className={className} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
        <Icon size={size} />
      </motion.div>
    );
  }
  if (name === "sparkle") {
    return (
      <motion.div className={className} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
        <Icon size={size} />
      </motion.div>
    );
  }
  if (name === "bag") {
    return (
      <motion.div className={className} animate={{ y: [0, -4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
        <Icon size={size} />
      </motion.div>
    );
  }
  if (name === "card") {
    return (
      <motion.div className={className} style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
        <Icon size={size} />
      </motion.div>
    );
  }
  if (name === "package") {
    return (
      <motion.div className={className} animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        <Icon size={size} />
      </motion.div>
    );
  }
  return (
    <motion.div className={className} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
      <Icon size={size} />
    </motion.div>
  );
}
