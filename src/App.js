import React, {useEffect, useState} from 'react';
import { Route, Routes, useLocation} from 'react-router-dom';
import User from './User';
import Header from './Header';
import Signin from './Signin'; // Make sure to import these components correctly
import Signup from './Signup';
import CreatePost from './CreatePost';
import EditPost from './EditPost';
import EditUser from './EditUser';
import Post from './Post';
import axios from 'axios';
import MainMap from './MainMap';

function App() {
  const [status, setStatus] = useState({
    authenticated: false,
    username: "",
  });
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      const token = localStorage.getItem("token");
      axios({
        method: 'get',
        url: "http://localhost:8080/api/user/view",
        headers: {
          'Content-Type': 'application/json',
          'Authentication': token,
        },
      })
      .then((res) => {
        setStatus({
          authenticated: true,
          username: res.data.username,
        });
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
    }
  }, [location]);

  return(
    <>
      <Header authenticated={status.authenticated} username={status.username} />
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user/:username" element={<User />} />
        <Route path='/user/edit' element={<EditUser />}/>
        <Route path="/post/:id" element={<Post />} />
        <Route path="/post/create" element={<CreatePost />} />
        <Route path="/post/edit/:postId" element={<EditPost />} />
        <Route path="/" element={<MainMap />} /> {/* Add MainMap to a route */}
      </Routes>
    </>
  );
}



export default App;
