import React, { useEffect, useContext, useCallback, useState } from "react";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Context from "./Context";

import styles from "./App.module.scss";

const apiURl = 'http://folionet-api-dev.eba-mjcz8maz.us-east-1.elasticbeanstalk.com/api/v1';

declare global {
  interface Window { ReactNativeWebView: any; } 
}

const App = () => {
  const { linkSuccess, folionetToken, isItemAccess, dispatch } = useContext(Context);
  const [loading, setLoading] = useState(true)
  const [veo, setVeo] = useState('')

  const getInfo = useCallback(async () => {
    const response = await fetch("/api/info", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { backend: false } });
      return { paymentInitiation: false };
    }
    const data = await response.json();
    const paymentInitiation: boolean = data.products.includes(
      "payment_initiation"
    );
    dispatch({
      type: "SET_STATE",
      state: {
        products: data.products,
      },
    });
    return { paymentInitiation };
  }, [dispatch]);

  const getDataToDevice = (data: string) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(data)
    }
  }

  const generateToken = useCallback(
    async (paymentInitiation) => {
      const path = paymentInitiation
        ? "/api/create_link_token_for_payment"
        : "/plaid/link_token";
      const response = await fetch(`${apiURl}/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${folionetToken}`
        }
      });
      if (!response.ok) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }
      const data = await response.json();
      if (data.status !== 500) {
        dispatch({ type: "SET_STATE", state: { linkToken: data.data.link_token} });
        localStorage.setItem("link_token", data.data.link_token); //to use later for Oauth
        setLoading(false)
      } else {
        alert('something bad happened')
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }
    },
    [dispatch, folionetToken]
  );


  useEffect(() => {
    window.addEventListener('message', data => {
     // do something
     const objData = JSON.parse(data.data)
     if(objData.folionetToken) {
       dispatch({ type: "SET_STATE", state: { folionetToken: objData.folionetToken} });
     }
    });

    const init = async () => {

      //const { paymentInitiation } = await getInfo(); // used to determine which path to take when generating token
      // do not generate a new token for OAuth redirect; instead
      // setLinkToken from localStorage
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: localStorage.getItem("link_token"),
          },
        });
        return;
      }
      generateToken(false);
    };
    if(folionetToken) {
      init();
    }
  }, [dispatch, generateToken, getInfo]);

  return (
    <div className={styles.appcontainer}>
      <div className={styles.container}>
        {
          loading ? (
            <div>
              <p>Loading</p>
            </div>
          ) : (
            <>
            <p>{ veo }</p>
            <Header />
            </>
          )
        }
      </div>
    </div>
  );
};

export default App;
