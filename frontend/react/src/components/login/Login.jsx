import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Flex,
    FormLabel,
    Heading,
    Input,
    Link,
    Stack,
    Text,
} from '@chakra-ui/react';
import {Formik, Form, useField} from "formik";
import * as Yup from 'yup';
import {useAuth} from "../context/AuthContext.jsx";
import {errorNotification} from "../../services/notification.js";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";

const MyTextInput = ({label, ...props}) => {
    // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
    // which we can spread on <input>. We can use field meta to show an error
    // message if the field is invalid and it has been touched (i.e. visited)
    const [field, meta] = useField(props);
    return (
        <Box>
            <FormLabel htmlFor={props.id || props.name}>{label}</FormLabel>
            <Input className="text-input" {...field} {...props} />
            {meta.touched && meta.error ? (
                <Alert className="error" status={"error"} mt={2}>
                    <AlertIcon/>
                    {meta.error}
                </Alert>
            ) : null}
        </Box>
    );
};

const LoginForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    return (
        <Formik
            validateOnMount={true}
            validationSchema={
                Yup.object({
                    username: Yup.string()
                        .email("Must be valid email")
                        .required("Email is required"),
                    password: Yup.string()
                        .max(20, "Password cannot be more than 20 characters")
                        .required("Password is required")
                })
            }
            initialValues={{username: '', password: ''}}
            onSubmit={(values, {setSubmitting}) => {
                setSubmitting(true);
                login(values).then(res => {
                    navigate("/dashboard")
                    console.log("Successfully logged in");
                }).catch(err => {
                    errorNotification(
                        err.code,
                        err.response.data.message
                    )
                }).finally(() => {
                    setSubmitting(false);
                })
            }}>

            {({isValid, isSubmitting}) => (
                <Form>
                    <Stack mt={15} spacing={15}>
                        <MyTextInput
                            label={"Email"}
                            name={"username"}
                            type={"email"}
                            placeholder={"hello@kaiyuewei.com"}
                        />
                        <MyTextInput
                            label={"Password"}
                            name={"password"}
                            type={"password"}
                            placeholder={"Type your password"}
                        />

                        <Button
                            type={"submit"}
                            disabled={!isValid || isSubmitting}>
                            Login
                        </Button>
                    </Stack>
                </Form>
            )}

        </Formik>
    )
}

const Login = () => {

    const { customer } = useAuth();
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
                        Sign in to your account
                    </Heading>
                    <LoginForm/>
                    <Link color={'accent'} href={"/signup"} fontSize={'sm'}>
                        Don&apos;t have an account? Sign up.
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
                    Practice makes <Text as="span" color={'accent'}>permanent.</Text>
                </Heading>
                <Text fontSize={'md'} color={'ink4'} textAlign={"center"} maxW={'sm'}>
                    Sharpen your communication with AI-powered speech feedback on clarity, structure, and delivery.
                </Text>
            </Flex>
        </Stack>
    );
}

export default Login;