import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    connectSocket,
    disconnectSocket
} from "../services/socket";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {

    const [socket, setSocket] = useState(null);

    useEffect(() => {

        const newSocket = connectSocket();

        setSocket(newSocket);

        return () => {

            disconnectSocket();

        };

    }, []);

    return (

        <SocketContext.Provider
            value={socket}
        >

            {children}

        </SocketContext.Provider>

    );

};

export const useSocket = () => {

    return useContext(SocketContext);

};