import React,{ useState, useEffect, useContext } from 'react';
import MaterialTable from 'material-table';
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import ConfirmationDialogRaw from '../components/ConfirmationDialogRaw';
import { 
  features,
  dateStyle,
  language
} from 'config';
import { FirebaseContext } from 'common';

const BookingHistory = () => {
  const { api } = useContext(FirebaseContext);
  const {
    cancelBooking
  } = api;
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const [role, setRole] = useState(null);
  
  const columns =  [
      { title: language.booking_id, field: 'id' },
      { title: language.booking_date, field: 'tripdate', render: rowData => rowData.tripdate?new Date(rowData.tripdate).toLocaleString(dateStyle):null},
      { title: language.car_type, field: 'carType' },
      { title: language.customer_name,field: 'customer_name'},
      { title: language.pickup_address, field: 'pickupAddress' },
      { title: language.drop_address, field: 'dropAddress' },
      { title: language.assign_driver, field: 'driver_name' },
      { title: language.deliveryPerson, field: 'deliveryPerson' },
      { title: language.deliveryPersonPhone, field: 'deliveryPersonPhone' },
      { title: language.pickUpInstructions, field: 'pickUpInstructions' },
      { title: language.deliveryInstructions, field: 'deliveryInstructions' },
      { title: language.parcel_type, render: rowData => <span>{rowData.parcelTypeSelected?rowData.parcelTypeSelected.description + " (" + rowData.parcelTypeSelected.amount + ")":""}</span> },
      { title: language.parcel_option, render: rowData => <span>{rowData.optionSelected?rowData.optionSelected.description + " (" + rowData.optionSelected.amount + ")":""}</span> },
      { title: language.booking_status, field: 'status', render: rowData => <span>{language[rowData.status]}</span> },
      { title: language.take_pickup_image,  field: 'pickup_image',render: rowData => rowData.pickup_image?<img alt='Pick Up' src={rowData.pickup_image} style={{width: 150}}/>:null, editable:'never'},
      { title: language.take_deliver_image,  field: 'deliver_image',render: rowData => rowData.deliver_image?<img alt='Deliver' src={rowData.deliver_image} style={{width: 150}}/>:null, editable:'never'},
      { title: language.cancellation_reason, field: 'reason'},
      { title: language.otp, field: 'otp', render: rowData => rowData.status ==='NEW' || rowData.status === 'ACCEPTED' ?<span>{rowData.otp}</span>:null },
      { title: language.trip_cost, field: 'trip_cost' },
      { title: language.trip_start_time, field: 'trip_start_time' },
      { title: language.trip_end_time, field: 'trip_end_time' },
      { title: language.total_time, field: 'total_trip_time' },
      { title: language.distance, field: 'estimateDistance' },
      { title: language.vehicle_no, field: 'vehicle_number' },  
      { title: language.trip_cost_driver_share, field: 'driver_share'},
      { title: language.convenience_fee, field: 'convenience_fees'},
      { title: language.discount_ammount, field: 'discount'},      
      { title: language.Customer_paid, field: 'customer_paid'},
      { title: language.payment_mode, field: 'payment_mode'},
      { title: language.payment_gateway, field: 'gateway'},
      { title: language.cash_payment_amount, field: 'cashPaymentAmount'},
      { title: language.card_payment_amount, field: 'cardPaymentAmount'},
      { title: language.wallet_payment_amount, field: 'usedWalletMoney'}
  ];
  const [data, setData] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const bookinglistdata = useSelector(state => state.bookinglistdata);

  useEffect(()=>{
        if(bookinglistdata.bookings){
            setData(bookinglistdata.bookings);
        }else{
          setData([]);
        }
  },[bookinglistdata.bookings]);

  useEffect(() => {
    if(auth.info && auth.info.profile){
      setRole(auth.info.profile.usertype);
    }
  }, [auth.info]);

  const onConfirmClose=(value)=>{
    if(value){
      dispatch(cancelBooking({
        reason:value,
        booking:selectedBooking
      }));
    }
    setOpenConfirm(false);
  }
  
  return (
    bookinglistdata.loading? <CircularLoading/>:
    <div>
    <MaterialTable
      title={language.booking_title}
      columns={columns}
      data={data}
      options={{
        actionsColumnIndex: -1,
        exportButton: features.AllowCriticalEditsAdmin,
        sorting: true
      }}
      actions={[
        rowData => ({
          icon: 'cancel',
          tooltip: language.cancel_booking,
          disabled: rowData.status==='NEW' || rowData.status==='ACCEPTED' || rowData.status==='PAYMENT_PENDING'? false:true,
          onClick: (event, rowData) => {
            if(features.AllowCriticalEditsAdmin && (role==='rider' || role ==='admin')){
              if(rowData.status==='NEW' || rowData.status==='ACCEPTED'){
                setSelectedBooking(rowData);
                setOpenConfirm(true);
              }else{
                setTimeout(()=>{
                  dispatch(cancelBooking({
                    reason: language.cancelled_incomplete_booking,
                    booking:rowData
                  }));
                },1500);
              }
            }else{
              alert(language.demo_mode);
            }
          }         
        }),
      ]}
    />
    <ConfirmationDialogRaw
      open={openConfirm}
      onClose={onConfirmClose}
      value={''}
    />
    </div>

  );
}

export default BookingHistory;
