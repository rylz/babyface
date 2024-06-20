import * as React from 'react';
import { useState, useEffect } from 'react';
import { createRoot} from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const ImageUpload = (props) => {
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const name = props.name || "imageupload";

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectURL = URL.createObjectURL(selectedFile);
    setPreview(objectURL);

    // free whenever component is unmounted
    return () => URL.revokeObjectURL(objectURL);
  }, [selectedFile]);

  const onSelectFile = e => {
    if (!e.target.files || e.target.files.length == 0) {
      setSelectedFile(undefined);
      return;
    }
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div>
      <input type='file' onChange={onSelectFile} name={props.name} /><br />
      { selectedFile && <img src={preview} style={{ width: "30%", height: "auto" }} /> }
    </div>
  );
};

const root = createRoot(document.getElementById('app'));

let App = (props) => {
  return (
    <>
      // Navbar
      <div className="w3-top">
        <div className="w3-bar w3-theme w3-top w3-left-align w3-large">
          <a href="/" className="w3-bar-item w3-button w3-theme-l1">👶</a>
          <a href="/about" className="w3-bar-item w3-button w3-hide-small w3-hover-white">About</a>
        </div>
      </div>

      <div className="w3-main">

        <div className="w3-row w3-padding-64">
          <div className="w3-twothird w3-container">
            {props.children}
          </div>
        </div>

      </div>
    </>
  )
}

let AboutPage = () => {
  return (
    <>
      <h1 className="w3-text-teal">About BabyFace</h1>
      <p>BabyFace is a simple app built on top of <a href="https://en.wikipedia.org/wiki/FaceNet">FaceNet</a> to resolve the age-old debate: &quot;Does baby look more like Mommy or Daddy?&quot; Created by Riley Patterson after months of listening to his wife&apos;s family say his daughter looked more like him, and his own family say she looked more like his wife.</p>
      <p>The <a href="https://github.com/rylz/babyface">source code is available on github</a>.</p>
    </>
  )
}

let PhotoUpload = () => {
  const [compareRequest, setCompareRequest] = useState();
  const [compareResponse, setCompareResponse] = useState();

  const handleResponse = (e) => {
    var data = JSON.parse(e.target.response);
    setCompareResponse(data);
    console.log(data);
    setCompareRequest(undefined);
    document.getElementById("comparephotossubmit").disabled = false;
  };

  const handleClick = (e) => {
    if (compareRequest) {
        e.preventDefault();
        return false;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/compare");
    xhr.onload = handleResponse;
    xhr.send(new FormData(e.target));
    e.preventDefault();
    setCompareRequest(xhr);
    document.getElementById("comparephotossubmit").disabled = true;
    return false;
  };

  return (
    <>
      <h1 className="w3-text-teal">Choose Photos</h1>
      <p>Select photos that only contain a single face! Ideally, pick parent photos from when they were around the same age as the baby.</p>
      <form id="comparephotos" action="/compare" encType="multipart/form-data" method="POST" onSubmit={ handleClick } >
        <table className="w3-table w3-striped">
          <tr>
            <td style={{ width: "100px" }} ><label htmlFor="base">Baby Photo:</label></td>
            <td><ImageUpload name="base" /></td>
          </tr>
          <tr>
            <td style={{ width: "100px" }} ><label htmlFor="parent1">Parent 1:</label></td>
            <td><ImageUpload name="parent1" /></td>
          </tr>
          <tr>
            <td style={{ width: "100px" }} ><label htmlFor="parent2">Parent 2:</label></td>
            <td><ImageUpload name="parent2" /></td>
          </tr>
        </table>
        <input id="comparephotossubmit" type="submit" value="Compare!" />
      </form>
      { compareResponse &&
        <>
            <h1 className="w3-text-teal">Results</h1>
            {
              (compareResponse.parent1.dist < compareResponse.parent2.dist) ?
                (
                  <p>Parent 1 is {Math.round(100 * (1 - compareResponse.parent1.dist / compareResponse.parent2.dist))}% more similar to baby than Parent 2</p>
                ) :
                (
                  <p>Parent 2 is {Math.round(100 * (1 - compareResponse.parent2.dist / compareResponse.parent1.dist))}% more similar to baby than Parent 1</p>
                )
            }
            <table className="w3-table w3-striped">
              <tr>
                <th></th>
                <th>Cropped Face</th>
                <th>Distance in Embedding</th>
              </tr>
              <tr>
                <td style={{ width: "100px" }} >Baby:</td>
                <td><img src={compareResponse.base.crop} style={{ width: "30%", height: "auto" }} /></td>
              </tr>
              <tr>
                <td style={{ width: "100px" }} >Parent 1:</td>
                <td><img src={compareResponse.parent1.crop} style={{ width: "30%", height: "auto" }} /></td>
                <td>{compareResponse.parent1.dist}</td>
              </tr>
              <tr>
                <td style={{ width: "100px" }} >Parent 2:</td>
                <td><img src={compareResponse.parent2.crop} style={{ width: "30%", height: "auto" }} /></td>
                <td>{compareResponse.parent2.dist}</td>
              </tr>
            </table>
        </>
      }
    </>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App><PhotoUpload /></App>
  },
  {
    path: "/about",
    element: <App><AboutPage /></App>
  },
]);

root.render(<RouterProvider router={router} />);
