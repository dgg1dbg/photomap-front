import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import View from "ol/View";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Icon, Style } from "ol/style";
import Overlay from "ol/Overlay";
import { fromLonLat } from "ol/proj"; // Import for coordinate transformation
import "./MainMap.css"; // Import your CSS
import { useNavigate } from "react-router-dom";

function MainMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const overlayRef = useRef(null);
  const [pictures, setPictures] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPictures() {
      const response = await fetch("http://localhost:8080/api/picture/viewAll", {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch pictures:", response.statusText);
        return [];
      }

      const pictures = await response.json();
      console.log("Fetched pictures:", pictures); // Debugging statement
      return pictures;
    }

    async function initializeMap() {
      const data = await fetchPictures();
      setPictures(data);

      if (!mapInstance.current) {
        // Initialize the map
        mapInstance.current = new Map({
          target: mapRef.current,
          view: new View({
            center: fromLonLat([127.766922, 35.907757]), // Center of South Korea
            zoom: 7,
          }),
          layers: [
            new TileLayer({
              source: new XYZ({
                url: "https://mt0.google.com/vt/lyrs=m&hl=ko&gl=KR&x={x}&y={y}&z={z}",
                crossOrigin: "anonymous",
              }),
            }),
          ],
        });
      }

      // Create an overlay for the popup
      const popup = document.createElement('div');
      popup.className = 'popup'; 
      overlayRef.current = new Overlay({
        element: popup,
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -20],
      });
      mapInstance.current.addOverlay(overlayRef.current);

      const vectorSource = new VectorSource();
      data.forEach(picture => {
        const feature = new Feature({
          geometry: new Point([picture.longitude, picture.latitude]), // Correct coordinate transformation
          name: picture.description,
          pictureUrl: picture.fileDir,
          postId: picture.postId
        });
        feature.setStyle(new Style({
          image: new Icon({
            src: 'https://openlayers.org/en/latest/examples/data/icon.png',
            scale: 0.3,
          })
        }));
        vectorSource.addFeature(feature);
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource
      });

      mapInstance.current.addLayer(vectorLayer);

      mapInstance.current.on('click', function (evt) {
        const feature = mapInstance.current.forEachFeatureAtPixel(evt.pixel, function (feature) {
          return feature;
        });

        if (feature) {
          const postId = feature.get('postId'); // Get the postId from the feature
          if (postId) {
            navigate(`/post/${postId}`); // Redirect to the post page
          }
        }
      });

      // Add click event listener
      mapInstance.current.on('pointermove', function (evt) {
        const feature = mapInstance.current.forEachFeatureAtPixel(evt.pixel, function (feature) {
          return feature;
        });

        if (feature) {
          const coordinates = feature.getGeometry().getCoordinates();
          const pictureUrl = feature.get('pictureUrl');

          overlayRef.current.setPosition(coordinates);
          popup.innerHTML = `<img src="http://localhost:8080/api/picture/${pictureUrl}" alt="Picture" style="width: 100px; height: 100px;" />`;
        } else {
          overlayRef.current.setPosition(undefined);
        }
      });
    }

    initializeMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
      }
    };
  }, []);

  return (
    <div
      id="map"
      ref={mapRef}
      style={{ width: "100%", height: "100vh" }}
    ></div>
  );
}

export default MainMap;
