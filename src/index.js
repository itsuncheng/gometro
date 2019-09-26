import React from "react";
import ReactDOM from "react-dom";
// import { makeStyles } from '@material-ui/core/styles';
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
// import MenuIcon from '@material-ui/icons/Menu';

import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./styles.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// var table = document.getElementById("table1");
var prev_date = new Date();

// const data = [{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 15 }, { x: 4, y: 12 }];
const data = [
  { time: "Page A", count: 400 },
  { time: "Page B", count: 300 },
  { time: "Page C", count: 200 }
];

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = { count: 0, tableContent: [] };
  }

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user"
          }
        })
        .then(stream => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });
      const modelPromise = cocoSsd.load();
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  renderPredictions = predictions => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    var countPeople = 0;

    predictions.forEach(prediction => {
      if (prediction.class === "person") {
        const x = prediction.bbox[0];
        const y = prediction.bbox[1];
        const width = prediction.bbox[2];
        const height = prediction.bbox[3];
        // Draw the bounding box.
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);
        // Draw the label background.
        ctx.fillStyle = "#00FFFF";
        const textWidth = ctx.measureText(prediction.class).width;
        const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(x, y, textWidth + 4, textHeight + 4);

        countPeople = countPeople + 1;
      }
    });

    predictions.forEach(prediction => {
      if (prediction.class === "person") {
        const x = prediction.bbox[0];
        const y = prediction.bbox[1];
        // Draw the text last to ensure it's on top.
        ctx.fillStyle = "#000000";
        ctx.fillText(prediction.class, x, y);
      }
    });

    this.setState(function(state, props) {
      return {
        count: countPeople
      };
    });

    let newTab = this.state.tableContent;

    var now = new Date();
    var hours = String(now.getHours());
    var mins = String(now.getMinutes()).padStart(2, "0");
    var secs = String(now.getSeconds()).padStart(2, "0");
    var now_string = hours + ": " + mins + ": " + secs;

    const diffTime = Math.abs(now.getTime() - prev_date.getTime());
    const diffSecs = Math.ceil(diffTime / 1000);
    if (diffSecs > 3) {
      newTab.push({
        time: now_string,
        count: this.state.count
      });

      this.setState({
        tableContent: newTab
      });

      prev_date = now;

      // data.push({
      //   time: "Page",
      //   count: 2
      // });
    }
  };

  render() {
    // const data = this.state.tableContent.map(item => (item));
    // this.state.tableContent.map(item => console.log("count " + item.count));
    // console.log("data: ", data);
    return (
      <div>
        <AppBar position="static" style={{ background: "#009440" }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="Menu">
              {/* <MenuIcon /> */}
              <img
                src="logo.png"
                alt="Italian Trulli"
                // style="display: block;
                // margin-left: auto;
                // margin-right: auto;
                // margin-top: 30px"
              />
              GoMetro
            </IconButton>
          </Toolbar>
        </AppBar>
        <video
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          width="800"
          height="800"
          style={{
            position: "absolute",
            top: "30px",
            left: "20px"
          }}
        />
        <canvas
          // className="size"
          ref={this.canvasRef}
          width="800"
          height="800"
          style={{
            position: "absolute",
            top: "30px",
            left: "20px"
          }}
        />

        <div style={{ marginTop: "50px", marginLeft: "850px" }}>
          Count: {this.state.count}
        </div>
        <table
          style={{ marginLeft: "850px", marginTop: "30px" }}
          class="pure-table"
        >
          <thead>
            <tr>
              <th>Time</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {this.state.tableContent.map(item => (
              <tr key={item.key}>
                <td>{item.time}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ position: "absolute", top: "130px", left: "1030px" }}>
          <LineChart
            width={400}
            height={400}
            data={this.state.tableContent.slice()}
          >
            <XAxis dataKey="time" />
            <YAxis />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <Line
              strokeWidth={2}
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
            />
            <Tooltip />
          </LineChart>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
