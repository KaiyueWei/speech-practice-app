import {useAuth} from "../context/AuthContext.jsx";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {Flex, Heading, Link, Stack, Text} from "@chakra-ui/react";
import CreateCustomerForm from "../shared/CreateCustomerForm.jsx";

const Signup = () => {
    const { customer, setCustomerFromToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (customer) {
            navigate("/dashboard");
        }
    })

    return (
        <Stack minH={'100vh'} direction={{base: 'column', md: 'row'}} bg={'bg'}>
            <Flex p={8} flex={1} alignItems={'center'} justifyContent={'center'}>
                <Stack spacing={6} w={'full'} maxW={'md'}>
                    <Heading
                        fontFamily={'heading'}
                        fontSize={'4xl'}
                        fontWeight={'normal'}
                        color={'ink'}
                        alignSelf={"center"}
                    >
                        speak<Text as="span" color={'accent'}>.</Text>practice
                    </Heading>
                    <Heading
                        fontFamily={'body'}
                        fontSize={'xl'}
                        fontWeight={'medium'}
                        color={'ink'}
                        mt={4}
                    >
                        Create your account
                    </Heading>
                    <CreateCustomerForm onSuccess={(token) => {
                        localStorage.setItem("access_token", token)
                        setCustomerFromToken()
                        navigate("/dashboard");
                    }}/>
                    <Link color={'accent'} href={"/"} fontSize={'sm'}>
                        Already have an account? Sign in.
                    </Link>
                </Stack>
            </Flex>
            <Flex
                flex={1}
                p={10}
                flexDirection={"column"}
                alignItems={"center"}
                justifyContent={"center"}
                bg={'ink'}
                display={{base: 'none', md: 'flex'}}
            >
                <Heading
                    fontFamily={'heading'}
                    fontSize={'5xl'}
                    fontWeight={'normal'}
                    color={'bg'}
                    mb={4}
                    textAlign={'center'}
                    lineHeight={1.1}
                >
                    Start where you <Text as="span" color={'accent'}>are.</Text>
                </Heading>
                <Text fontSize={'md'} color={'ink4'} textAlign={"center"} maxW={'sm'}>
                    Real-time AI feedback on every session — clarity, structure, and delivery, scored instantly.
                </Text>
            </Flex>
        </Stack>
    );
}

export default Signup;