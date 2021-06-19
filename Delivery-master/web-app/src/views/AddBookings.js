import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Select,
  MenuItem,
  Grid,
  Button,
  Typography,
  TextField,
  FormControlLabel,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Modal
} from '@material-ui/core';
import GoogleMapsAutoComplete from '../components/GoogleMapsAutoComplete';
import { useSelector, useDispatch } from "react-redux";
import AlertDialog from '../components/AlertDialog';
import { language } from 'config';
import { makeStyles } from '@material-ui/core/styles';
import UsersCombo from '../components/UsersCombo';
import { FirebaseContext } from 'common';
import { features } from 'config';

const useStyles = makeStyles(theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width:480,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  container: {
    zIndex: "12",
    color: "#FFFFFF",
    alignContent: 'center'
  },
  title: {
    color: "#000",
  },
  gridcontainer: {
    alignContent: 'center'
  },
  items: {
    margin: 0,
    width: '100%'
  },
  input: {
    fontSize: 18,
    color: "#000"
  },
  inputdimmed: {
    fontSize: 18,
    color: "#737373"
  },
  carphoto: {
    height: '18px',
    marginRight: '10px'
  },
  buttonStyle: {
    margin: 0,
    width: '100%',
    height: '100%'
  }
}));

export default function AddBookings(props) {
  const { api } = useContext(FirebaseContext);
  const {
    getEstimate,
    clearEstimate,
    addBooking,
    clearBooking,
    MinutesPassed,
    GetDateString
  } = api;
  const dispatch = useDispatch();
  const classes = useStyles();
  const cartypes = useSelector(state => state.cartypes.cars);
  const estimatedata = useSelector(state => state.estimatedata);
  const bookingdata = useSelector(state => state.bookingdata);
  const userdata = useSelector(state => state.usersdata);
  const settings = useSelector(state => state.settingsdata.settings);
  const [carType, setCarType] = useState(language.select_car);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [dropAddress, setDropAddress] = useState(null);
  const [optionModalStatus, setOptionModalStatus] = useState(false);
  const [estimateModalStatus, setEstimateModalStatus] = useState(false);
  const [selectedCarDetails, setSelectedCarDetails] = useState(null);
  const [users, setUsers] = useState(null);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [userCombo, setUserCombo] = useState(null);
  const [estimateRequested, setEstimateRequested] = useState(false);
  const [bookingType, setBookingType] = useState('Book Now');
  const rootRef = useRef(null);

  const [instructionData,setInstructionData] = useState({
    deliveryPerson : "",
    deliveryPersonPhone: "",
    pickUpInstructions: "",
    deliveryInstructions: "",
    parcelTypeIndex: 0,
    optionIndex: 0,
    parcelTypeSelected: null,
    optionSelected: null
  });

  const handleChange = (e) => {
    if(e.target.name === 'parcelTypeIndex'){
      setInstructionData({ 
        ...instructionData,
        parcelTypeIndex: parseInt(e.target.value),
        parcelTypeSelected: selectedCarDetails.parcelTypes[e.target.value]
      });
    }else if(e.target.name === 'optionIndex'){
      setInstructionData({ 
        ...instructionData,
        optionIndex: parseInt(e.target.value),
        optionSelected: selectedCarDetails.options[e.target.value]
      });
    }else{
      setInstructionData({ ...instructionData, [e.target.name]: e.target.value });
    }
  };

  const [selectedDate, setSelectedDate] = useState(GetDateString());

  const handleCarSelect = (event) => {
    setCarType(event.target.value);
    let carDetails = null;
    for (let i = 0; i < cartypes.length; i++) {
      if (cartypes[i].name === event.target.value) {
        carDetails = cartypes[i];
        let instObj = {...instructionData};
        if(Array.isArray(cartypes[i].parcelTypes)){
          instObj.parcelTypeSelected = cartypes[i].parcelTypes[0];
          instObj.parcelTypeIndex = 0;
        }
        if(Array.isArray(cartypes[i].options)){
          instObj.optionSelected = cartypes[i].options[0];
          instObj.optionIndex = 0;
        }
        setInstructionData(instObj);
      }
    }
    setSelectedCarDetails(carDetails);
  };

  const handleBookTypeSelect = (event) => {
    setBookingType(event.target.value);
    if (bookingType === 'Book Later') {
      setSelectedDate(GetDateString());
    }
  };

  const onDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  useEffect(() => {
    if (estimatedata.estimate && estimateRequested) {
      setEstimateRequested(false);
      setEstimateModalStatus(true);
    }
    if (userdata.users) {
      let arr = [];
      for (let i = 0; i < userdata.users.length; i++) {
        let user = userdata.users[i];
        if (user.usertype === 'rider') {
          arr.push({
            'firstName': user.firstName,
            'lastName': user.lastName,
            'mobile': user.mobile,
            'email': user.email,
            'uid': user.id,
            'desc': user.firstName + ' ' + user.lastName + ' (' + (features.AllowCriticalEditsAdmin? user.mobile : "Hidden") + ') ' + (features.AllowCriticalEditsAdmin? user.email : "Hidden"),
            'pushToken': user.pushToken
          });
        }
      }
      setUsers(arr);
    }
  }, [estimatedata.estimate, userdata.users, estimateRequested]);

  const handleGetOptions = (e) => {
    e.preventDefault();
    setEstimateRequested(true);
    if (userCombo && pickupAddress && dropAddress && selectedCarDetails) {
      if (bookingType === 'Book Now') {
        if(Array.isArray(selectedCarDetails.options) || Array.isArray(selectedCarDetails.parcelTypes)){
          setOptionModalStatus(true);
        }else{
          let estimateRequest = {
            pickup: pickupAddress,
            drop: dropAddress,
            carDetails: selectedCarDetails,
            instructionData: instructionData
          };
          dispatch(getEstimate(estimateRequest));
        }
      } else {
        if (bookingType === 'Book Later' && selectedDate) {
          if (MinutesPassed(selectedDate) >= 15) {
            if(Array.isArray(selectedCarDetails.options) || Array.isArray(selectedCarDetails.parcelTypes)){
              setOptionModalStatus(true);
            }else{
              let estimateRequest = {
                pickup: pickupAddress,
                drop: dropAddress,
                carDetails: selectedCarDetails,
                instructionData: instructionData
              };
              dispatch(getEstimate(estimateRequest));
            }
          } else {
            setCommonAlert({ open: true, msg: language.past_booking_error });
          }
        } else {
          setCommonAlert({ open: true, msg: language.select_proper });
        }
      }
    } else {
      setCommonAlert({ open: true, msg: language.select_proper })
    }    
  }

  const handleGetEstimate = (e) => {
    e.preventDefault();
    setOptionModalStatus(false);
    let estimateRequest = {
      pickup: pickupAddress,
      drop: dropAddress,
      carDetails: selectedCarDetails,
      instructionData: instructionData
    };
    dispatch(getEstimate(estimateRequest));
  };

  const confirmBooking = (e) => {
    e.preventDefault();
    if(instructionData.deliveryPerson && instructionData.deliveryPersonPhone){
      setEstimateModalStatus(false);
      let bookingObject = {
        pickup: pickupAddress,
        drop: dropAddress,
        carDetails: selectedCarDetails,
        userDetails: {
          uid: userCombo.uid,
          profile: {
            firstName: userCombo.firstName,
            lastName: userCombo.lastName,
            mobile: userCombo.mobile,
            pushToken: userCombo.pushToken
          }
        },
        estimate: estimatedata.estimate,
        instructionData: instructionData,
        tripdate: new Date(selectedDate).toString(),
        bookLater: bookingType === 'Book Later' ? true : false,
        settings: settings,
        booking_type_web: true
      };
      dispatch(addBooking(bookingObject));
    }else{
      alert(language.deliveryDetailMissing);
    }
  };

  const handleOptionModalClose = (e) => {
    e.preventDefault();
    setOptionModalStatus(false);
  };

  const handleEstimateModalClose = (e) => {
    e.preventDefault();
    setEstimateModalStatus(false);
    dispatch(clearEstimate());
    setEstimateRequested(false);
  };

  const handleEstimateErrorClose = (e) => {
    e.preventDefault();
    dispatch(clearEstimate());
    setEstimateRequested(false);
  };

  const handleBookingAlertClose = (e) => {
    e.preventDefault();
    dispatch(clearBooking());
    dispatch(clearEstimate());
    clearForm();
  };

  const clearForm = () => {
    setUserCombo(null);
    setPickupAddress(null);
    setDropAddress(null);
    setSelectedCarDetails(null);
    setCarType(language.select_car);
    setBookingType(language.book_now);
    setEstimateRequested(false);
  }

  const handleBookingErrorClose = (e) => {
    e.preventDefault();
    dispatch(clearBooking());
    setEstimateRequested(false);
  };

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

  return (
    <div className={classes.container} ref={rootRef}>
      <Grid item xs={12} sm={12} md={8} lg={8}>
        <Grid container spacing={2} >
          <Grid item xs={12}>
            <Typography component="h1" variant="h5" className={classes.title}>
              {language.addbookinglable}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            {users ?
              <UsersCombo
                className={classes.items}
                placeholder={language.select_user}
                users={users}
                value={userCombo}
                onChange={(event, newValue) => {
                  setUserCombo(newValue);
                }}
              />
              : null}
          </Grid>
          <Grid item xs={12}>
            <GoogleMapsAutoComplete
              variant={"outlined"}
              placeholder={language.pickup_location}
              value={pickupAddress}
              className={classes.items}
              onChange={
                (value) => {
                  setPickupAddress(value);
                }
              }
            />
          </Grid>
          <Grid item xs={12}>
            <GoogleMapsAutoComplete placeholder={language.drop_location}
              variant={"outlined"}
              value={dropAddress}
              className={classes.items}
              onChange={
                (value) => {
                  setDropAddress(value);
                }
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            {cartypes ?
              <Select
                id="car-type-native"
                value={carType}
                onChange={handleCarSelect}
                variant="outlined"
                fullWidth
                className={carType === language.select_car ? classes.inputdimmed : classes.input}
              >
                <MenuItem value={language.select_car} key={language.select_car}>
                  {language.select_car}
                </MenuItem>
                {
                  cartypes.map((car) =>
                    <MenuItem key={car.name} value={car.name}>
                      <img src={car.image} className={classes.carphoto} alt="car types" />{car.name}
                    </MenuItem>
                  )
                }
              </Select>
              : null}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Select
              id="booking-type-native"
              value={bookingType}
              onChange={handleBookTypeSelect}
              className={classes.input}
              variant="outlined"
              fullWidth
              inputProps={{ 'aria-label': 'Without label' }}
            >
              <MenuItem key={"Book Now"} value={"Book Now"}>
                {language.book_now}
              </MenuItem>
              <MenuItem key={"Book Later"} value={"Book Later"}>
                {language.book_later}
              </MenuItem>
            </Select>
          </Grid>
          {bookingType === 'Book Later' ?
            <Grid item xs={12} sm={6} >
              <TextField
                id="datetime-local"
                label={language.booking_date_time}
                type="datetime-local"
                variant="outlined"
                fullWidth
                className={classes.commonInputStyle}
                InputProps={{
                  className: classes.input
                }}
                value={selectedDate}
                onChange={onDateChange}
              />
            </Grid>
            : null}
          <Grid item xs={12} sm={6} >
            <Button
              size="large"
              onClick={handleGetOptions}
              variant="contained"
              color="primary"
              className={classes.buttonStyle}
            >
              <i className="fas fa-car" />
              {language.book}
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        open={optionModalStatus}
        onClose={handleOptionModalClose}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <Grid container spacing={2} className={classes.paper}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
          {selectedCarDetails && selectedCarDetails.parcelTypes?
            <FormControl component="fieldset">
              <FormLabel component="legend">{language.parcel_types}</FormLabel>
              <RadioGroup name="parcelTypeIndex" value={instructionData.parcelTypeIndex} onChange={handleChange}>
                {selectedCarDetails.parcelTypes.map((element,index) =>
                  <FormControlLabel key={element.description} value={index} control={<Radio />} label={ settings.symbol + ' ' +  element.amount + ' - ' +  element.description} />
                )}
              </RadioGroup>
            </FormControl>
          :null}
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
          {selectedCarDetails && selectedCarDetails.options?
            <FormControl component="fieldset">
              <FormLabel component="legend">{language.options}</FormLabel>
              <RadioGroup name="optionIndex" value={instructionData.optionIndex} onChange={handleChange}>
                {selectedCarDetails.options.map((element,index) =>
                  <FormControlLabel key={element.description} value={index} control={<Radio />} label={ settings.symbol + ' ' + element.amount + ' - ' + element.description} />
                )}
              </RadioGroup>
            </FormControl>
          :null}
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
          <Button onClick={handleOptionModalClose} variant="contained" color="primary">
            {language.cancel}
          </Button>
          <Button onClick={handleGetEstimate} variant="contained" color="primary" style={{marginLeft:10}}>
            {language.get_estimate}
          </Button>
          </Grid>
        </Grid>
      </Modal>
      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        open={estimateModalStatus}
        onClose={handleEstimateModalClose}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <Grid container spacing={1} className={classes.paper}>
            <Typography component="h2" variant="h5" color="primary" style={{marginTop:15}}>
                {language.delivery_information}
            </Typography>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="deliveryPerson"
                label={language.deliveryPerson}
                name="deliveryPerson"
                autoComplete="deliveryPerson"
                onChange={handleChange}
                value={instructionData.deliveryPerson}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="deliveryPersonPhone"
                label={language.deliveryPersonPhone}
                name="deliveryPersonPhone"
                autoComplete="deliveryPersonPhone"
                onChange={handleChange}
                value={instructionData.deliveryPersonPhone}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="pickUpInstructions"
                label={language.pickUpInstructions}
                name="pickUpInstructions"
                autoComplete="pickUpInstructions"
                onChange={handleChange}
                value={instructionData.pickUpInstructions}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="deliveryInstructions"
                label={language.deliveryInstructions}
                name="deliveryInstructions"
                autoComplete="deliveryInstructions"
                onChange={handleChange}
                value={instructionData.deliveryInstructions}
              />
            </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Typography color={'primary'} style={{fontSize:30}}>
              {language.total} - {settings?settings.symbol:null} {estimatedata.estimate ? estimatedata.estimate.estimateFare : null}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Button onClick={handleEstimateModalClose} variant="contained" color="primary">
              {language.cancel}
            </Button>
            <Button onClick={confirmBooking} variant="contained" color="primary" style={{marginLeft:10}}>
              {language.book_now}
            </Button>
          </Grid>
        </Grid>
      </Modal>
      <AlertDialog open={bookingdata.booking ? true : false} onClose={handleBookingAlertClose}>{bookingdata.booking ? language.booking_success + bookingdata.booking.booking_id : null}</AlertDialog>
      <AlertDialog open={bookingdata.error.flag} onClose={handleBookingErrorClose}>{bookingdata.error.msg}</AlertDialog>
      <AlertDialog open={estimatedata.error.flag} onClose={handleEstimateErrorClose}>{estimatedata.error.msg}</AlertDialog>
      <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
    </div>
  );
}