import React, { useEffect, useContext } from "react";
import { usePlaidLink } from "react-plaid-link";
// import Button from "plaid-threads/Button";

import Context from "../../Context";
import ArrowRight from './ArrowRight';
import styles from "./link.module.scss";

const apiURl = 'http://folionet-api-dev.eba-mjcz8maz.us-east-1.elasticbeanstalk.com/api/v1';
const Link = () => {
  const { linkToken, dispatch } = useContext(Context);

  const sendDataToDevice = (data: string) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(data)
    }
  }

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // send public_token to server
      console.log({ public_token })
      const setToken = async () => {
        const response = await fetch(`${apiURl}/plaid/access_token`, {
          method: "POST",
          headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MTY2ODUyNjksInN1YiI6MX0.ukKv1F6rp86dYJX8bNobr4qUP63hV9knBjqGBFARwWg'
          },
          body: JSON.stringify({
            public_token: public_token
          }),
        });
        if (!response.ok) {
          dispatch({
            type: "SET_STATE",
            state: {
              itemId: `no item_id retrieved`,
              accessToken: `no access_token retrieved`,
              isItemAccess: false,
            },
          });
          return;
        }
        const data = await response.json();
        console.log(data)
        sendDataToDevice(data.access_token);
        dispatch({
          type: "SET_STATE",
          state: {
            itemId: data.item_id,
            accessToken: data.access_token,
            isItemAccess: true,
          },
        });
      };
      setToken();
      dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      window.history.pushState("", "", "/");
    },
    [dispatch]
  );

  let isOauth = false;
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  if (window.location.href.includes("?oauth_state_id=")) {
    // TODO: figure out how to delete this ts-ignore
    // @ts-ignore
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  return (
    <div>
      <p className={styles.description}>
      Transfer money from your US bank to your Folionet account Easily deposito and withdraw funds without commision
      </p>
    <button className={styles.button} type="button" onClick={() => open()} disabled={!ready}>
      <p className={styles.buttonText}>Choose your bank</p>
      <ArrowRight />
    </button>
    </div>
  );
};

Link.displayName = "Link";

export default Link;
