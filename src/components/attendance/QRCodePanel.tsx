import { motion, AnimatePresence } from "motion/react";
import QRCode from "react-qr-code";
import Spinner from "../ui/spinner";
import { Card } from "../ui/card";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { CircleAlertIcon, FileWarningIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

// Add duration plugin to dayjs
dayjs.extend(duration);

// Create a separate countdown component for better organization
function CountdownTimer({ exp }: { exp: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = dayjs();
      const expTime = dayjs(exp);
      const diff = expTime.diff(now);

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const duration = dayjs.duration(diff);
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [exp]);

  return (
    <div className="text-sm font-medium">
      <span className="text-gray-500">Expires in: </span>
      <span
        className={`${
          timeLeft === "Expired" ? "text-red-500" : "text-blue-500"
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
}

interface QRCodePanelProps {
  isLoading: boolean;
  isOpen: boolean;
  qrCode?: string;
  exp?: string;
}

export default function QRCodePanel({
  isLoading,
  isOpen,
  qrCode,
  exp,
}: QRCodePanelProps) {
  const fadeInScale = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: {
      duration: 0.2,
      ease: "easeInOut",
      exit: { duration: 0.15 },
    },
  };

  // Determine which content to show
  const getContent = () => {
    if (isLoading || (isOpen && !qrCode)) {
      return (
        <motion.div
          key="loader"
          {...fadeInScale}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        >
          <Spinner className="w-12 h-12 text-blue-500" />
          <p className="text-sm text-gray-500">Loading...</p>
        </motion.div>
      );
    }

    if (qrCode && isOpen) {
      return (
        <motion.div
          key="qrcode"
          {...fadeInScale}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        >
          <Tooltip>
            <TooltipTrigger>
              <div className="p-4 bg-gray-50 rounded-lg !pb-0">
                <QRCode value={qrCode} size={256} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <a
                className="max-w-[200px] text-center break-all"
                href={qrCode}
                target="_blank"
                rel="noopener noreferrer"
              >
                {qrCode}
              </a>
            </TooltipContent>
          </Tooltip>
          {exp && <CountdownTimer exp={exp} />}
          <p className="text-sm text-gray-500 text-center">
            Scan this QR code to take attendance
          </p>
        </motion.div>
      );
    }

    // Only show the "room closed" message when isOpen is false
    return (
      <motion.div
        key="message"
        {...fadeInScale}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <CircleAlertIcon className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium mb-2">QR Code Not Available</p>
        <p className="text-sm text-gray-500 text-center">
          The room is currently closed. Open the room to generate a QR code.
        </p>
      </motion.div>
    );
  };

  return (
    <Card className="bg-white rounded border border-gray-200 p-8 h-full shadow-none">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Attendance QR Code
      </h2>
      <div className="relative h-[350px]">
        <AnimatePresence mode="wait">{getContent()}</AnimatePresence>
      </div>
    </Card>
  );
}
