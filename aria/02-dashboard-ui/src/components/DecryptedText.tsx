"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
// [ARIA] REMOVED: import { useInView } from "react"; — not exported from React
// [ARIA] REMOVED: import { useInView } from "motion/react"; — not available in all versions

// [ARIA] Polyfill: motion/react may not export useInView in all versions.
// Using a local IntersectionObserver-based useInView hook instead.
function useInViewLocal(ref: React.RefObject<Element | null>, options?: { once?: boolean }) {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                if (options?.once) observer.disconnect();
            } else if (!options?.once) {
                setInView(false);
            }
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref, options?.once]);
    return inView;
}

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
  [key: string]: any;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLSpanElement>(null);
  // [ARIA] Use local IntersectionObserver polyfill instead of motion's useInView
  const isInView = useInViewLocal(containerRef, { once: true });

  useEffect(() => {
    let interval: any;
    let currentIteration = 0;

    const getNextChar = (char: string) => {
      if (useOriginalCharsOnly) {
        const index = Math.floor(Math.random() * text.length);
        return text[index];
      }
      const index = Math.floor(Math.random() * characters.length);
      return characters[index];
    };

    const scramble = () => {
      if (sequential) {
        if (revealedIndices.size < text.length) {
          interval = setInterval(() => {
            setDisplayText((prevText) => {
              return prevText
                .split("")
                .map((char, i) => {
                  if (revealedIndices.has(i)) {
                    return text[i];
                  }
                  return getNextChar(char);
                })
                .join("");
            });

            setRevealedIndices((prev) => {
              const next = new Set(prev);
              if (revealDirection === "start") {
                next.add(prev.size);
              } else if (revealDirection === "end") {
                next.add(text.length - 1 - prev.size);
              } else if (revealDirection === "center") {
                const middle = Math.floor(text.length / 2);
                const offset = Math.ceil(prev.size / 2);
                if (prev.size % 2 === 0) {
                   next.add(middle + offset);
                } else {
                   next.add(middle - offset);
                }
              } else {
                 next.add(prev.size); 
              }
              if (next.size >= text.length) {
                clearInterval(interval);
                setIsScrambling(false);
                setDisplayText(text);
              }
              return next;
            });
          }, speed);
        } else {
            setIsScrambling(false);
        }
      } else {
        setDisplayText(
          text
            .split("")
            .map((char) => (char === " " ? " " : getNextChar(char)))
            .join("")
        );
        interval = setInterval(() => {
          setDisplayText((prevText) => {
            const next = prevText
              .split("")
              .map((char, i) => {
                if (char === " ") return " ";
                if (Math.random() < 0.1) return text[i];
                return getNextChar(char);
              })
              .join("");
              
            if (next === text) {
                clearInterval(interval);
                setIsScrambling(false);
            }
            return next;
          });
          currentIteration++;
          if (currentIteration > maxIterations) {
            clearInterval(interval);
            setIsScrambling(false);
            setDisplayText(text);
          }
        }, speed);
      }
    };

    if (isHovering) {
         setIsScrambling(true);
         scramble();
    } else if (animateOn === "view" && isInView && !isScrambling && revealedIndices.size === 0) {
        setIsScrambling(true);
        scramble();
    }

    return () => clearInterval(interval);
  }, [isHovering, isInView, animateOn, text, speed, maxIterations, sequential, revealDirection, characters, useOriginalCharsOnly]);

  useEffect(() => {
      // Force initial text
      if (animateOn === "view" && !isInView) {
          setDisplayText(text.split("").map(c => c === " " ? " " : characters[Math.floor(Math.random() * characters.length)]).join(""));
      }
  }, [isInView, animateOn, text, characters]);
  
  
  // Simplified logic for "view" mode: simply run the effect once when in view
  useEffect(() => {
      if (animateOn === "view" && isInView) {
          let interval: NodeJS.Timeout;
          let iteration = 0;
          
          const fullText = text;
          
          if (sequential) {
            // Sequential Reveal Logic
            let currentIndex = 0;
            interval = setInterval(() => {
                setDisplayText(prev => {
                    return prev.split("").map((char, index) => {
                        if (index < currentIndex) return fullText[index];
                        return characters[Math.floor(Math.random() * characters.length)];
                    }).join("");
                });
                currentIndex++;
                if (currentIndex > fullText.length) {
                    clearInterval(interval);
                    setDisplayText(fullText);
                }
            }, speed);
          } else {
             // Random Reveal Logic
             interval = setInterval(() => {
              setDisplayText(prev => {
                  return prev
                  .split("")
                  .map((char, index) => {
                      if (char === " ") return " ";
                      if (fullText[index] === char) return char; // Keep if already revealed (probabilistic)
                      if (iteration >= maxIterations) return fullText[index]; // Force reveal at end
                      
                      // Probabilistic reveal
                      if (Math.random() > 0.9) return fullText[index];
                      return characters[Math.floor(Math.random() * characters.length)];
                  })
                  .join("");
              });
              
              iteration++;
              if (iteration > maxIterations + 5) {
                clearInterval(interval);
                setDisplayText(fullText);
              }
            }, speed);
          }
          
          return () => clearInterval(interval);
      }
  }, [animateOn, isInView, text, speed, maxIterations, sequential, characters]);

  const handleMouseEnter = () => {
      if (animateOn === "hover") setIsHovering(true);
  };

  const handleMouseLeave = () => {
      if (animateOn === "hover") setIsHovering(false);
  };

  return (
    <span
      ref={containerRef}
      className={`${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <span className={className}>
          {displayText}
      </span>
    </span>
  );
}
