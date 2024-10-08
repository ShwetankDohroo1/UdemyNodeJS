const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/APIFeatures');
exports.aliasTopTours = (req,res,next)=>{
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.Getalltours = async (req, res) => {
    try {
        const features = new APIFeatures(Tour.find(),req.query).filter().sorting().limitfields().paginate();
        const tours = await features.query; 
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: { tours }
        });
    } 
    catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getTourById = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({
                status: 'fail',
                message: 'No tour found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { tour }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.createTour = async (req, res) => {
    console.log(req.body);
    console.log('Headers:', req.headers);
    try {
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { tour: newTour }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!tour) {
            return res.status(404).json({
                status: 'fail',
                message: 'No tour found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { tour }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


exports.deleteTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndDelete(req.params.id);
        if (!tour) {
            return res.status(404).json({
                status: 'fail',
                message: 'No tour found with that ID'
            });
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    } 
    catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


exports.getTourStates = async(req,res) => {
    try{
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte : 4.5}}
            },
            {
                $group: {
                    _id: {$toUpper: '$difficulty'},
                    numRating: {$sum: '$ratingsQuantity'},
                    numTours: {$sum: 1},
                    avgRating: {$avg: '$ratingsAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'},
                }
            },
            {
                $sort: {
                    avgPrice: 1,
                }
            },
        ])
        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    }
    catch(err){
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

exports.getMonthlyPlans = async (req,res) =>{
    try{
        const year = req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match:{
                    startDates: {$gte: new Date(`${year}-01-01`),
                                 $lte: new Date(`${year}-12-31`)},
                                
                }
            },
            {
                $group:{
                    _id: {$month: '$startDates'},
                    numTourStarts: {$sum: 1},
                    tours: {$push: '$name'}
                }
            },
            {
                $addFields:{
                    month: '$_id'
                }
            },
            {
                $project:{
                    _id: 0
                }
            },
            {
                $sort:{
                    numTourStarts: -1
                }
            },
        ]);
        res.status(200).json({
            status: 'success',
            data: { plan }
        });
    }
    catch(err){
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}