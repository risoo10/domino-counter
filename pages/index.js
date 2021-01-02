import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import { loadOpenCv, processCircles } from "../utilities/image-operations";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [processing, setProcessing] = useState(false);
  const [count, setCount] = useState(null);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const videoElement = useRef(null);
  const canvasEl = useRef(null);
  const [circlePrecision, setCirclePrecision] = useState(30);
  const [circleMinDistance, setCircleMinDistance] = useState(15);
  const maxVideoSize = 400;

  function onClick() {
    setCanvasVisible(true);
    setProcessing(true);
    const ctx = canvasEl.current.getContext("2d");
    ctx.drawImage(videoElement.current, 0, 0, maxVideoSize, maxVideoSize);
    setTimeout(async () => {
      const image = ctx.getImageData(0, 0, maxVideoSize, maxVideoSize);
      const { outputImage, count } = await processCircles(
        image,
        circleMinDistance,
        circlePrecision
      );
      ctx.putImageData(outputImage, 0, 0);
      setProcessing(false);
      setCount(count);
    });
  }

  function reset() {
    setCanvasVisible(false);
    setProcessing(false);
    setCount(null);
  }

  useEffect(async () => {
    loadOpenCv();
    const videoLoaded = await setupCamera();
    videoLoaded.play();
  }, []);

  async function setupCamera() {
    videoElement.current.width = maxVideoSize;
    videoElement.current.height = maxVideoSize;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "environment",
          width: maxVideoSize,
          height: maxVideoSize,
        },
      });
      videoElement.current.srcObject = stream;

      return new Promise((resolve) => {
        videoElement.current.onloadedmetadata = () => {
          resolve(videoElement.current);
        };
      });
    }
    const errorMessage =
      "This browser does not support video capture, or this device does not have a camera";
    alert(errorMessage);
    return Promise.reject(errorMessage);
  }

  return (
    <div className="wrapper">
      <div className="inputs">
        <div className="form-group">
          <label htmlFor="precision">Precision:</label>
          <input
            id="precision"
            value={circlePrecision}
            onChange={(event) => setCirclePrecision(+event.target.value)}
            type="number"
            placeholder="Precision"
          />
        </div>
        <div className="form-group">
          <label htmlFor="precision">Distance:</label>
          <input
            value={circleMinDistance}
            onChange={(event) => setCircleMinDistance(+event.target.value)}
            type="number"
            placeholder="Min distance"
          />
        </div>
      </div>
      <div className="video-wrapper">
        <video className="video" playsInline ref={videoElement} />
        <canvas
          className={`image`}
          ref={canvasEl}
          style={{
            maxHeight: maxVideoSize,
            maxWidth: maxVideoSize,
            visibility: canvasVisible ? "visible" : "hidden",
          }}
          width={maxVideoSize}
          height={maxVideoSize}
        ></canvas>
        {canvasVisible && (
          <button className={`close-canvas`} onClick={reset}>
            X
          </button>
        )}
      </div>
      <button
        className={`action-button`}
        disabled={processing}
        onClick={onClick}
      >
        {count === null
          ? processing
            ? "Processing..."
            : "Take a photo"
          : count && `Count: ${count}`}
      </button>
    </div>
  );
}
