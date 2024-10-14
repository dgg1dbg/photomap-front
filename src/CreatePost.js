import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import XYZ from "ol/source/XYZ";
import { Vector as VectorSource } from "ol/source";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Style, Icon, Text, Fill, Stroke } from "ol/style";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import "./CreatePost.css";

function CreatePost() {
  const [postData, setPostData] = useState({
    name: "",
    hashtag: "",
    date: "",
    time: "",
    description: "",
    pictures: [],
    pictureDescriptions: [],
    pictureCoordinates: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [currentPictureIndex, setCurrentPictureIndex] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef();
  const markersLayerRef = useRef(
    new VectorLayer({
      source: new VectorSource(),
    })
  );

  const markersRef = useRef([]);

  useEffect(() => {
    const southKoreaExtent = [
      fromLonLat([123.5, 32.0]), // Bottom-left corner (SW)
      fromLonLat([131.484375, 38.634036]), // Top-right corner (NE)
    ];

    const initialMap = new Map({
      target: mapContainerRef.current,
      view: new View({
        center: fromLonLat([127.766922, 35.907757]), // Center of South Korea
        zoom: 5, // Suitable zoom level for South Korea
        extent: [
          ...southKoreaExtent[0], 
          ...southKoreaExtent[1],
        ],
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://mt0.google.com/vt/lyrs=m&hl=ko&gl=KR&x={x}&y={y}&z={z}",
            crossOrigin: "anonymous",
          }),
        }),
        markersLayerRef.current, 
      ],
    });

    mapRef.current = initialMap;

    window.addEventListener('resize', handleResize);

    return () => {
      initialMap.setTarget(undefined);
      window.removeEventListener('resize', handleResize);
    };
  }, []); 

  const handleResize = () => {
    if (mapRef.current) {
      mapRef.current.updateSize();
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      const handleMapClick = (evt) => {
        if (currentPictureIndex !== null) {
          const coordinates = evt.coordinate;
          handleCoordinateSelection(coordinates);
        }
      };

      mapRef.current.on("click", handleMapClick);

      return () => {
        mapRef.current.un("click", handleMapClick);
      };
    }
  }, [currentPictureIndex]);

  const handleCoordinateSelection = (coordinates) => {
    const newCoordinates = [...postData.pictureCoordinates];
    newCoordinates[currentPictureIndex] = coordinates; 
    setPostData({ ...postData, pictureCoordinates: newCoordinates });

    removeMarker(currentPictureIndex);

    addMarker(coordinates, currentPictureIndex);
  };

  const addMarker = (coordinates, index) => {
    const marker = new Feature({
      geometry: new Point(coordinates),
    });

    marker.setStyle(
      new Style({
        text: new Text({
          text: (index + 1).toString(),
          fill: new Fill({ color: "#ffffff" }), 
          stroke: new Stroke({ color: "#000000", width: 3 }), 
          font: "bold 14px Arial",
          offsetY: -25, 
        }),
        image: new Icon({
          src: "https://openlayers.org/en/v6.5.0/examples/data/icon.png",
          scale: 0.1, 
          anchor: [0.5, 1], 
        }),
      })
    );

    markersLayerRef.current.getSource().addFeature(marker);
    markersRef.current[index] = marker;
  };

  const removeMarker = (index) => {
    const oldMarker = markersRef.current[index];
    if (oldMarker) {
      markersLayerRef.current.getSource().removeFeature(oldMarker);
      markersRef.current[index] = null; 
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPostData({
      ...postData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]); // Append new files to existing ones
  };

  const handlePictureDescriptionsChange = (index, value) => {
    const newDescriptions = [...postData.pictureDescriptions];
    newDescriptions[index] = value;
    setPostData({ ...postData, pictureDescriptions: newDescriptions });
  };

  const handleSetCoordinates = (index) => {
    setCurrentPictureIndex(index);

    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = `url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewport='0 0 100 100' style='fill:black;font-size:20px;font-family:sans-serif'%3E%3Ctext x='10' y='20'%3E${index + 1}%3C/text%3E%3C/svg%3E), auto`;
    }
  };

  const isCoordinateSet = (index) => {
    return postData.pictureCoordinates[index] && postData.pictureCoordinates[index].length > 0;
  };

  const handleDeletePicture = (index) => {
    // Remove the picture from selectedFiles
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  
    // Remove the corresponding description
    const newDescriptions = [...postData.pictureDescriptions];
    newDescriptions.splice(index, 1);
    setPostData({ ...postData, pictureDescriptions: newDescriptions });
  
    // Remove the corresponding coordinates
    const newCoordinates = [...postData.pictureCoordinates];
    newCoordinates.splice(index, 1);
    setPostData({ ...postData, pictureCoordinates: newCoordinates });
  
    // Clear all markers and re-add them with updated indices
    clearAllMarkers();
    newCoordinates.forEach((coords, idx) => {
      if (coords && coords.length === 2) {
        addMarker(coords, idx); // Re-add the markers with correct indices
      }
    });
  
    setCurrentPictureIndex(null);
  };
  
  // Function to clear all markers
  const clearAllMarkers = () => {
    markersLayerRef.current.getSource().clear(); // Clear all markers from the map
    markersRef.current = []; // Reset the markers reference array
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("name", postData.name);
    formData.append("hashtag", postData.hashtag);
    formData.append("date", postData.date);
    formData.append("time", postData.time);
    formData.append("description", postData.description);

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
      formData.append("descriptions", postData.pictureDescriptions[i] || "");
      formData.append("coordinates", JSON.stringify(postData.pictureCoordinates[i] || []));
    }
    console.log(formData);

    axios({
      method: "post",
      url: "http://localhost:8080/api/post/create",
      headers: {
        "Content-Type": "multipart/form-data",
        Authentication: token,
      },
      data: formData,
    })
      .then((res) => {
        console.log(res);
        navigate("/user/" + res.data.user.username);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to create the post. Please try again.");
      });
  };

  return (
    <div className="create-post-container">
      <h2>Create New Post</h2>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="form-map-container">
        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="name"
              value={postData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Tag:</label>
            <input
              type="text"
              name="hashtag"
              value={postData.hashtag}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Shoot Date:</label>
            <input
              type="date"
              name="date"
              value={postData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Shoot Time:</label>
            <input
              type="time"
              name="time"
              value={postData.time}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Details:</label>
            <textarea
              name="description"
              value={postData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
              <label>Pictures:</label>
              <input
                type="file"
                name="pictures"
                multiple
                onChange={handleFileChange}
              />
              <div className="selected-pictures">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="picture-preview">
                    <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} />
                    <button type="button" onClick={() => handleDeletePicture(index)}>
                      Delete
                    </button>
                    <input
                      type="text"
                      value={postData.pictureDescriptions[index] || ""}
                      onChange={(e) => handlePictureDescriptionsChange(index, e.target.value)}
                      placeholder={`Description for picture ${index + 1}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSetCoordinates(index)}
                      className={isCoordinateSet(index) ? 'coordinate-set' : ''}
                    >
                      {isCoordinateSet(index) ? 'Update Coordinates' : 'Set Coordinates'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="submit-button">
              Create Post
            </button>
          </form>
        </div>
        <div className="map-wrapper">
          <div id="map" ref={mapContainerRef} className="map-container"></div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
