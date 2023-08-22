class ResObject {
    constructor(res, data) {
        let json = {
            status: 'success',
            message: data?.message,
            data: data?.data
        };
        return res.send(json);
    }
}

export default ResObject