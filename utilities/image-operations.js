export async function processCircles(image, minDistance, precision) {
  return new Promise((res, rej) => {
    try {
      const img = cv.matFromImageData(image);
      let greyImg = new cv.Mat();
      let binary = new cv.Mat();
      let circles = new cv.Mat();
      let color = new cv.Scalar(0, 0, 255, 255);
      cv.cvtColor(img, greyImg, cv.COLOR_BGR2GRAY);
      cv.convertScaleAbs(greyImg, greyImg, 0.85, 0);
    //   cv.threshold(greyImg, binary, 160, 250, cv.THRESH_BINARY);
      cv.HoughCircles(greyImg, circles, cv.HOUGH_GRADIENT, 1, minDistance, 100, precision, 1, 25);
      // draw circles
      for (let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3];
        let y = circles.data32F[i * 3 + 1];
        let radius = circles.data32F[i * 3 + 2];
        let center = new cv.Point(x, y);
        cv.circle(img, center, radius, color, -1);
      }
      res({ outputImage: imageDataFromMat(img), count: circles.cols });
    } catch (e) {
      console.error(e);
      rej({ msg: "Error during Image processing" });
    }
  });
}

export function loadOpenCv() {
  const OPENCV_URL = "opencv.js";
  let script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("type", "text/javascript");
  script.addEventListener("load", async () => {
    if (cv.getBuildInformation) {
      console.log(cv.getBuildInformation());
      onloadCallback();
    } else {
      // WASM
      if (cv instanceof Promise) {
        cv = await cv;
        console.log(cv.getBuildInformation());
      } else {
        cv["onRuntimeInitialized"] = () => {
          console.log(cv.getBuildInformation());
        };
      }
    }
  });
  script.addEventListener("error", () => {
    self.printError("Failed to load " + OPENCV_URL);
  });
  script.src = OPENCV_URL;
  let node = document.getElementsByTagName("script")[0];
  node.parentNode.insertBefore(script, node);
}

export function imageDataFromMat(mat) {
  // convert the mat type to cv.CV_8U
  const img = new cv.Mat();
  const depth = mat.type() % 8;
  const scale =
    depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0;
  const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0;
  mat.convertTo(img, cv.CV_8U, scale, shift);

  // convert the img type to cv.CV_8UC4
  switch (img.type()) {
    case cv.CV_8UC1:
      cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
      break;
    case cv.CV_8UC3:
      cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
      break;
    case cv.CV_8UC4:
      break;
    default:
      throw new Error(
        "Bad number of channels (Source image must have 1, 3 or 4 channels)"
      );
  }
  const clampedArray = new ImageData(
    new Uint8ClampedArray(img.data),
    img.cols,
    img.rows
  );
  img.delete();
  return clampedArray;
}
