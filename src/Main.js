import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate 사용
import './Main.css';
import Nav from './Nav';
import Content from './Content';
import Popup from './Popup';
import Like from './Like';
import logo from './logo.png';
import banner from './banner.png';
import axios from "axios";


export default function Main() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();  // URL 변경을 위한 navigate
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // 로그인 상태 관리
  
  useEffect(() => {
    axios.get("http://localhost:8080/checkSession", { withCredentials: true })
      .then((res) => {
        if (res.data.includes("Logged in as")) {
          setIsLoggedIn(true);  // 로그인 상태일 때
        }
      })
      .catch((error) => {
        setIsLoggedIn(false);  // 로그인 상태가 아닐 때
        console.error("로그인 확인 실패:", error);
      });
  }, []);

  useEffect(() => {
    axios.get("http://localhost:8080/")
      .then((res) => {
        console.log("items : " + res.data);
        setItems(res.data)
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  const [mode, setMode] = useState('LIST');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [nextId, setNextId] = useState(5);

  const openPopup = () => {
    setIsPopupOpen(true);
    navigate('/create');  // /create로 URL 변경하여 팝업 열기
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setMode('LIST');
    navigate('/');  // 모드가 LIST일 때 메인 페이지로 돌아가기
  };

  const onDelete = async (id) => {
    try {
      console.log("삭제하려는 아이디: ", id);  // 아이디 확인

      // 서버로 DELETE 요청 보내기
      const response = await axios.delete(`http://localhost:8080/deleteItem/${id}`);
      console.log(response.data.message); // 서버 응답 출력
      // 삭제 후 UI에서 항목 제거
      setItems((prevItems) => prevItems.filter(item => item.id !== id));

      // nextId를 업데이트: 남은 아이템 중 가장 큰 id + 1
      const maxId = items.reduce((max, item) => (item.id > max ? item.id : max), 0);
      setNextId(maxId + 1); // 가장 큰 id 값 + 1을 설정
    } catch (error) {
      console.error("삭제 실패:", error);
    }

  };

  const onCreate = (img, title, price, description) => {
    axios.post('/addItem', {
      img: img,
      title: title,
      price: parseInt(price),
      description: description
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        console.log('상품 등록 성공', response.data);

        const newTopic = {
          id: nextId,
          img: img,
          title: title,
          price: price,
          body: description,
          like: false
        };

        const newTopics = [...items, newTopic];
        setItems(newTopics);
        setNextId(nextId + 1);

        navigate('/main');  // 상품 등록 후 메인 페이지로 리다이렉트

        closePopup();
      })
      .catch((error) => {
        console.error('상품 등록 실패', error);
        navigate('/main');
      });
  };

  const handleLogout = () => {
    // 로그아웃 API 호출
    axios.post('http://localhost:8080/logout', {}, { withCredentials: true })
      .then((response) => {
        console.log(response.data);  // 로그아웃 성공 메시지
        setIsLoggedIn(false);  // 로그아웃 상태로 변경
        navigate('/login');  // 로그인 페이지로 리다이렉트
      })
      .catch((error) => {
        console.error('Logout failed', error);
      });
  };

  let content = null;

  if (mode === 'LIKE') {
    content = <Like items={items} setItems={setItems} />;
  } else if (mode === 'CREATE') {
    content = (
      <Popup
        mode="CREATE"
        onCreate={onCreate}
        closePopup={closePopup}
      />
    );
  } else if (mode === 'ITEM') { // 상세페이지
    content = (
      <Popup
        mode="ITEM"
        data={items}
        closePopup={closePopup}
      />
    );
  } else if (mode === 'LIST') {
    content = <Content items={items} setItems={setItems} onDelete={onDelete} />;
  } 

  return (
    <div className='container'>
      <div className='Main'>
        <div className='titleBox' style={{display:'flex', flexDirection:"row", justifyContent:'space-between'}}>
          <h2 className='title'><img src={logo} alt="로고" />TEMTEMU</h2>

          <div style={{display: 'flex', alignItems: "center", justifyContent : "center", gap : "10px"}}>
          {!isLoggedIn ? (
              <>
                <a href="/login" className='login'>로그인</a>
                <span> | </span>
                <a href="/sign" className="sign">회원가입</a>
              </>
            ) : (
              <>
                <p className="logout" onClick={handleLogout}>로그아웃</p> {/* 로그아웃 버튼 */}
              </>
            )}

          </div>
         

        </div>
        <div className='container2'>
          <img src={banner} alt="배너" className='banner' />
        </div>
        <Nav mode={mode} setMode={setMode} />
        {content}
      </div>
    </div>
  );
}
