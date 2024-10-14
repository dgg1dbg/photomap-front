import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
import { Tooltip } from "react-tooltip";
import ExifReader from 'exifreader';
import "./Post.css"; // Import the CSS file

function Picture({ picture }) {
    const [exifData, setExifData] = useState(null);

    useEffect(() => {
        async function loadExifData() {
            try {
                // const response = await fetch(`http://localhost:8080/api/picture/${picture.fileDir}`);
                // const blob = await response.blob();
                const tags = await ExifReader.load(`http://localhost:8080/api/picture/${picture.fileDir}`);
                
                setExifData({
                    dateTime: tags['DateTimeOriginal']?.description || 'Unknown',
                    make: tags['Make']?.description || 'Unknown',
                    model: tags['Model']?.description || 'Unknown',
                    lens: tags['LensModel']?.description || 'Unknown',
                    iso: tags['ISOSpeedRatings']?.description || 'Unknown',
                    fNumber: tags['FNumber']?.description || 'Unknown',
                    exposureTime: tags['ExposureTime']?.description || 'Unknown',
                    focalLength: tags['FocalLength']?.description || 'Unknown',
                });
            } catch (error) {
                console.error('Error loading EXIF data:', error);
            }
        }

        loadExifData();
    }, [picture.fileDir]);
    return (
        <div className="picture-card">
            <img
                src={"http://localhost:8080/api/picture/" + picture.fileDir}
                alt={picture.description}
                data-tooltip-id={`pictureTooltip-${picture.fileDir}`}
            />
            <Tooltip id={`pictureTooltip-${picture.fileDir}`} place="bottom" effect="solid" className="tooltip">
                {exifData && (
                    <>
                        <p><strong>Date Taken:</strong> {exifData.dateTime}</p>
                        <p><strong>Camera:</strong> {exifData.make} {exifData.model}</p>
                        <p><strong>Lens:</strong> {exifData.lens}</p>
                        <p><strong>ISO:</strong> {exifData.iso}</p>
                        <p><strong>Aperture (F-Number):</strong> {exifData.fNumber}</p>
                        <p><strong>Exposure Time:</strong> {exifData.exposureTime}</p>
                        <p><strong>Focal Length:</strong> {exifData.focalLength}</p>
                    </>
                )}
            </Tooltip>
        </div>
    );
}

function PostMap({ pictures }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        if (!mapInstance.current) {
            // Initialize the map
            mapInstance.current = new Map({
                target: mapRef.current,
                view: new View({
                    center: fromLonLat([127.766922, 35.907757]), // Center of South Korea
                    zoom: 6,
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
        pictures.forEach((picture) => {
            const feature = new Feature({
                geometry: new Point([picture.longitude, picture.latitude]),
                name: picture.description,
                pictureUrl: picture.fileDir,
            });
            feature.setStyle(new Style({
                image: new Icon({
                    src: 'https://openlayers.org/en/latest/examples/data/icon.png',
                    scale: 0.5,
                })
            }));
            vectorSource.addFeature(feature);
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource
        });

        mapInstance.current.addLayer(vectorLayer);

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

        return () => {
            if (mapInstance.current) {
                mapInstance.current.setTarget(null);
            }
        };
    }, [pictures]);

    return <div className="map-container" ref={mapRef}></div>;
}

function Post() {
    const { id } = useParams(); // Get the post ID from the URL parameters
    const [post, setPost] = useState(null); // State to store the post data
    const [errorMessage, setErrorMessage] = useState(""); // State to handle errors
    const navigate = useNavigate();
    const handleUsernameClick = () => {
        navigate(`/user/${post.user.username}`);
      };
    useEffect(() => {
        const token = localStorage.getItem("token"); // Get the authentication token from local storage

        axios({
            method: 'get',
            url: `http://localhost:8080/api/post/view/` + id.toString(), // Fetch the post by its ID
            headers: {
                'Content-Type': 'application/json',
                'Authentication': token,
            },
        })
        .then((res) => {
            setPost(res.data); // Set the retrieved post data
        })
        .catch((err) => {
            console.error(err);
            setErrorMessage("Failed to load the post. Please try again."); // Handle errors
        });
    }, [id]); // Re-run the effect if the post ID changes

    if (errorMessage) {
        return <div className="error-message">{errorMessage}</div>; // Display error message if there is one
    }

    if (!post) {
        return <div className="loading-message">Loading...</div>; // Display loading state while data is being fetched
    }

    // Render the post details
    return (
        <div className="post-container">
            <div className="post-details">
                <h2>{post.name}</h2>
                <p><strong>Tag:</strong> {post.hashtag}</p>
                <p><strong>Shoot Date:</strong> {post.date}</p>
                <p><strong>Shoot Time:</strong> {post.time}</p>
                <p><strong>Details:</strong> {post.description}</p>
                <p>
                    <strong>Posted by:</strong>
                    <span onClick={handleUsernameClick} style={{ cursor: 'pointer'}}>{post.user.username}</span>
                </p>
                <h3>Pictures</h3>
                <div className="pictures-container">
                    {post.pictures.map((picture, index) => (
                        <Picture key={index} picture={picture} />
                    ))}
                </div>
            </div>

            {/* Render the map with markers for pictures */}
            <div className="post-map">
                <PostMap pictures={post.pictures} />
            </div>
        </div>
    );
}

export default Post;