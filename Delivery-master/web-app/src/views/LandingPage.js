import React, { useState, useEffect, useContext, useRef } from 'react';
import classNames from "classnames";
import { makeStyles } from '@material-ui/core/styles';
import Header from "components/Header/Header.js";
import Footer from "components/Footer/Footer.js";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import HeaderLinks from "components/Header/HeaderLinks.js";
import Parallax from "components/Parallax/Parallax.js";
import {
  Paper,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Modal,
  Grid,
  Typography
} from '@material-ui/core';
import GoogleMapsAutoComplete from '../components/GoogleMapsAutoComplete';
import styles from "assets/jss/material-kit-react/views/landingPage.js";
import ProductSection from "./Sections/ProductSection.js";
import SectionDownload from "./Sections/SectionDownload.js";
import { useSelector, useDispatch } from "react-redux";
import AlertDialog from '../components/AlertDialog';
import {language} from 'config';
import { FirebaseContext } from 'common';

const dashboardRoutes = [];

const useStyles = makeStyles(theme => ({
  ...styles,
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

export default function LandingPage(props) {
  const { api } = useContext(FirebaseContext);
  const {
    getEstimate, 
    clearEstimate,
    addBooking, 
    clearBooking,
    MinutesPassed,
    GetDateString
  } = api;
  const classes = useStyles();
  const dispatch = useDispatch();
  const { ...rest } = props;
  const cartypes = useSelector(state => state.cartypes.cars);
  const estimatedata = useSelector(state => state.estimatedata);
  const bookingdata = useSelector(state => state.bookingdata);
  const settings = useSelector(state => state.settingsdata.settings);
  const [carType, setCarType] = useState(language.select_car);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [dropAddress, setDropAddress] = useState(null);
  const [optionModalStatus, setOptionModalStatus] = useState(false);
  const [estimateModalStatus, setEstimateModalStatus] = useState(false);
  const [estimateRequested, setEstimateRequested] = useState(false);
  const [selectedCarDetails, setSelectedCarDetails] = useState(null);
  const auth = useSelector(state => state.auth);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [bookingType, setBookingType] = useState('Book Now');
  const [role, setRole] = useState(null);
  const [selectedDate, setSelectedDate] = React.useState(GetDateString());
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

  const handleCarSelect = (event) => {
    setCarType(event.target.value);
    let carDetails = null;
    for (let i = 0; i < cartypes.length; i++) {
      if (cartypes[i].name === event.target.value) {
        carDetails = cartypes[i];
      }
    }
    setSelectedCarDetails(carDetails);
  };

  const handleBookTypeSelect = (event) => {
      setBookingType(event.target.value);
      if(bookingType==='Book Later'){
          setSelectedDate(GetDateString());
      }
  };

  const onDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  useEffect(() => {
    if (estimatedata.estimate &&  estimateRequested) {
      setEstimateModalStatus(true);
    }
    if(auth.info && auth.info.profile){
      setRole(auth.info.profile.usertype);
    }
  }, [estimatedata.estimate,auth.info,  estimateRequested]);


  const handleGetOptions = (e) => {
    e.preventDefault();
    setEstimateRequested(true);
    if (auth.info) {
      if (pickupAddress && dropAddress && selectedCarDetails) {
        if(bookingType==='Book Now'){
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
        }else{
          if(bookingType==='Book Later' && selectedDate){
            if(MinutesPassed(selectedDate)>=15){
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
            }else{
              setCommonAlert({ open: true, msg: language.past_booking_error });
            }
          }else{
            setCommonAlert({ open: true, msg: language.select_proper });
          }
        }
      } else {
        setCommonAlert({ open: true, msg: language.select_proper })
      }
    } else {
      setCommonAlert({ open: true, msg: language.must_login })
    }
  };

  const handleGetEstimate = (e) => {
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
        userDetails: auth.info,
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
    props.history.push('/bookings');
  };

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
    <div>
      <Header
        color="transparent"
        routes={dashboardRoutes}
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{
          height: 400,
          color: "white"
        }}
        {...rest}
      />
      <Parallax filter image={require("assets/img/background.jpg")}>
        {(cartypes && !role) || (cartypes && (role === 'rider' || role === 'admin'))?
          <div className={classes.container}>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <br />
                <h1 className={classes.title}>{language.book_your_cab}</h1>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <Paper >
                  <GoogleMapsAutoComplete 
                    placeholder={language.pickup_location}
                    variant={"filled"}
                    value={pickupAddress}
                    onChange={
                      (value) => {
                        setPickupAddress(value);
                      }
                    }
                  />
                </Paper>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <Paper>
                  <GoogleMapsAutoComplete 
                    placeholder={language.drop_location}
                    variant={"filled"}
                    value={dropAddress}
                    onChange={
                      (value) => {
                        setDropAddress(value);
                      }
                    }
                  />
                </Paper>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
            <GridItem xs={6} sm={6} md={3} lg={3}>
                <FormControl style={{ width: '100%' }}>
                  <Select
                    id="car-type-native"
                    value={carType}
                    onChange={handleCarSelect}
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
                </FormControl>
              </GridItem>
              <GridItem xs={6} sm={6} md={3} lg={3}>
                <FormControl style={{ width: '100%' }}>
                  <Select
                    id="booking-type-native"
                    value={bookingType}
                    onChange={handleBookTypeSelect}
                    className={classes.input}
                    inputProps={{ 'aria-label': 'Without label' }}
                  >
                    <MenuItem key={"Book Now"} value={"Book Now"}>
                      {language.book_now}
                    </MenuItem>
                    <MenuItem key={"Book Later"} value={"Book Later"}>
                      {language.book_later}
                    </MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
            </GridContainer>
            <GridContainer spacing={2}>
              {bookingType==='Book Later'?
              <GridItem xs={6} sm={6} md={4} lg={4}>
                <TextField
                  id="datetime-local"
                  label={language.booking_date_time}
                  type="datetime-local"
                  variant="filled"
                  fullWidth
                  className={classes.commonInputStyle}
                  InputProps={{
                    className: classes.input
                  }}
                  value = {selectedDate}
                  onChange={onDateChange}
                />
              </GridItem>
              :null}
              <GridItem xs={6} sm={6} md={bookingType==='Book Later'?2:6} lg={bookingType==='Book Later'?2:6}>
                <Button
                  color="success"
                  size="lg"
                  rel="noopener noreferrer"
                  className={classes.items}
                  onClick={handleGetOptions}
                  style={{height:bookingType==='Book Later'?76:52}}
                >
                  <i className="fas fa-car" />
                  {language.book_now}
                </Button>
              </GridItem>
            </GridContainer>
          </div>
          : 
          <div className={classes.container}>
            <GridContainer spacing={2}>
              <GridItem xs={12} sm={12} md={6} lg={6}>
                <br />
                <h1 className={classes.title}>{language.landing_slogan}</h1>
              </GridItem>
            </GridContainer>
          </div>
          }
      </Parallax>
      <div className={classNames(classes.main, classes.mainRaised)}>
        <div className={classes.container}>
          <ProductSection />
        </div>
      </div>
      <div className={classNames(classes.main2, classes.mainRaised2)}>
        <div className={classes.container}>
          <SectionDownload />
        </div>
      </div>
      <Footer />
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
