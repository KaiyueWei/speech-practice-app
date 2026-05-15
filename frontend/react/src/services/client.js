import axios from 'axios';

const getAuthConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`
    }
})

export const getCustomers = async () => {
    try {
        return await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/customers`,
            getAuthConfig()
        )
    } catch (e) {
        throw e;
    }
}

export const saveCustomer = async (customer) => {
    try {
        return await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/customers`,
            customer
        )
    } catch (e) {
        throw e;
    }
}

export const updateCustomer = async (id, update) => {
    try {
        return await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/customers/${id}`,
            update,
            getAuthConfig()
        )
    } catch (e) {
        throw e;
    }
}

export const deleteCustomer = async (id) => {
    try {
        return await axios.delete(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/customers/${id}`,
            getAuthConfig()
        )
    } catch (e) {
        throw e;
    }
}

export const login = async (usernameAndPassword) => {
    try {
        return await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
            usernameAndPassword
        )
    } catch (e) {
        throw e;
    }
}

export const uploadCustomerProfilePicture = async (id, formData) => {
    try {
        return axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/customers/${id}/profile-image`,
            formData,
            {
                ...getAuthConfig(),
                'Content-Type' : 'multipart/form-data'
            }
        );
    } catch (e) {
        throw e;
    }
}

export const customerProfilePictureUrl = (id) =>
    `${import.meta.env.VITE_API_BASE_URL}/api/v1/customers/${id}/profile-image`;

export const getPrompts = async (mode) => {
    const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/prompts`,
        {
            ...getAuthConfig(),
            params: { mode },
        }
    )
    return response.data
}

export const getSessions = async ({ page = 0, size = 20 } = {}) => {
    const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/sessions`,
        {
            ...getAuthConfig(),
            params: { page, size, sort: 'createdAt,desc' },
        }
    )
    return response.data
}

export const getSessionDetail = async (sessionId) => {
    const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/sessions/${sessionId}`,
        getAuthConfig()
    )
    return response.data
}

export const createSession = async () => {
    const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/sessions`,
        null,
        getAuthConfig()
    )
    return response.data
}

export const markSessionRecorded = async (sessionId, durationSeconds = null) => {
    return await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/sessions/${sessionId}/recorded`,
        { durationSeconds },
        getAuthConfig()
    )
}

export const uploadAudioToPresignedUrl = async (uploadUrl, blob) => {
    // For real S3 presigned URLs the Authorization header is harmless (signature
    // is in query string). For local mock mode the URL points back at our own
    // /api/v1/sessions/{id}/audio endpoint which requires JWT auth.
    return await axios.put(uploadUrl, blob, {
        headers: {
            'Content-Type': blob.type || 'audio/webm',
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
        }
    })
}
