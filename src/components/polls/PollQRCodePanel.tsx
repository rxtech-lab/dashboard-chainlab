import { motion, AnimatePresence } from "motion/react";
import QRCode from "react-qr-code";
import Spinner from "../ui/spinner";
import { Card } from "../ui/card";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { CircleAlertIcon, FileWarningIcon, RefreshCwIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { refreshPollNonce } from "@/app/(internal)/(protected)/(sidebar)/polls/actions";
import { useSWRConfig } from "swr";

// Add duration plugin to dayjs
dayjs.extend(duration);

// Create a separate countdown component for better organization
function CountdownTimer({ exp, pollId }: { exp: string; pollId: number }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isRotating, setIsRotating] = useState(false);
  const { mutate } = useSWRConfig();

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

  const handleRefresh = async () => {
    setIsRotating(true);
    await refreshPollNonce(pollId);
    mutate(`/poll/${pollId}/url`);
    setTimeout(() => setIsRotating(false), 800);
  };

  return (
    <div className="text-sm font-medium flex items-center gap-2">
      <motion.button
        onClick={handleRefresh}
        initial={{ rotate: 0 }}
        animate={{ rotate: isRotating ? 720 : 0 }}
        whileHover={{ rotate: isRotating ? 720 : 360 }}
        transition={{
          duration: 0.8,
          ease: [0.3, 0, 0.2, 1],
          type: "tween",
          rotate: {
            duration: 0.8,
            ease: [0.3, 0, 0.2, 1],
          },
        }}
        exit={{ rotate: 0 }}
      >
        <RefreshCwIcon className="w-4 h-4 text-sky-500 active:text-yellow-800 hover:text-sky-800" />
      </motion.button>
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

interface PollQRCodePanelProps {
  isLoading: boolean;
  isOpen: boolean;
  qrCode?: string;
  exp?: string;
  pollId: number;
}

export default function PollQRCodePanel({
  isLoading,
  isOpen,
  qrCode,
  exp,
  pollId,
}: PollQRCodePanelProps) {
  const fadeInScale = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 },
  };

  return (
    <Card className="p-6 border border-gray-200 shadow relative overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            {...fadeInScale}
            className="flex flex-col items-center justify-center min-h-[400px]"
          >
            <Spinner />
            <p className="text-sm text-gray-500 mt-4">Generating QR Code...</p>
          </motion.div>
        ) : !isOpen ? (
          <motion.div
            key="closed"
            {...fadeInScale}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-full p-4 mb-4">
              <CircleAlertIcon className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Poll is Closed
            </h3>
            <p className="text-sm text-gray-600 max-w-xs">
              The poll is currently closed. Toggle the switch above to open it
              and generate a QR code for students.
            </p>
          </motion.div>
        ) : !qrCode ? (
          <motion.div
            key="error"
            {...fadeInScale}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="bg-red-50 border border-red-200 rounded-full p-4 mb-4">
              <FileWarningIcon className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Generate QR Code
            </h3>
            <p className="text-sm text-gray-600 max-w-xs">
              There was an error generating the QR code. Please try refreshing
              the page.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="qrcode"
            {...fadeInScale}
            className="flex flex-col items-center"
          >
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Poll QR Code
              </h3>
              <p className="text-sm text-gray-600">
                Students can scan this code to respond to the poll
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
              <QRCode
                value={qrCode}
                size={256}
                className="w-64 h-64"
                data-testid="qr-code"
              />
            </div>

            {exp && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 w-full">
                <CountdownTimer exp={exp} pollId={pollId} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-500 mt-2 cursor-help">
                      The QR code refreshes automatically for security
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      For security purposes, the QR code expires and refreshes
                      periodically. Students using an expired link will be
                      unable to respond.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <div className="mt-4 w-full">
              <p className="text-xs text-center text-gray-500">
                URL: {new URL(qrCode).pathname}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
