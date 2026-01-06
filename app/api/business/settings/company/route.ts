// app/api/business/posinventory/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerAxios } from "@/lib/serverAxios";


// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.slice(0, 10);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

// Remove phone formatting
const unformatPhoneNumber = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Convert 0/1 or string "0"/"1" to boolean
const toBool = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === '1' || value === 'true';
  return value === 1 || value === true;
};

// Convert PHPFox hours format to our format
const convertPhpfoxToOurFormat = (data: any) => {
  const isApplicable = data.locs_hours_status === '0' ? false : true;
  
  const hoursOfOperation = {
    mon: {
      isApplicable,
      schedule: data.locs_mon_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_mon_op),
      startMinute: convertTimeToMinute(data.locs_hr_mon_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_mon_op),
      endHour: convertTimeToHour(data.locs_hr_mon_cl),
      endMinute: convertTimeToMinute(data.locs_hr_mon_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_mon_cl),
    },
    tue: {
      isApplicable,
      schedule: data.locs_tue_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_tue_op),
      startMinute: convertTimeToMinute(data.locs_hr_tue_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_tue_op),
      endHour: convertTimeToHour(data.locs_hr_tue_cl),
      endMinute: convertTimeToMinute(data.locs_hr_tue_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_tue_cl),
    },
    wed: {
      isApplicable,
      schedule: data.locs_wed_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_wed_op),
      startMinute: convertTimeToMinute(data.locs_hr_wed_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_wed_op),
      endHour: convertTimeToHour(data.locs_hr_wed_cl),
      endMinute: convertTimeToMinute(data.locs_hr_wed_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_wed_cl),
    },
    thu: {
      isApplicable,
      schedule: data.locs_thu_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_thu_op),
      startMinute: convertTimeToMinute(data.locs_hr_thu_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_thu_op),
      endHour: convertTimeToHour(data.locs_hr_thu_cl),
      endMinute: convertTimeToMinute(data.locs_hr_thu_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_thu_cl),
    },
    fri: {
      isApplicable,
      schedule: data.locs_fri_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_fri_op),
      startMinute: convertTimeToMinute(data.locs_hr_fri_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_fri_op),
      endHour: convertTimeToHour(data.locs_hr_fri_cl),
      endMinute: convertTimeToMinute(data.locs_hr_fri_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_fri_cl),
    },
    sat: {
      isApplicable,
      schedule: data.locs_sat_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_sat_op),
      startMinute: convertTimeToMinute(data.locs_hr_sat_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_sat_op),
      endHour: convertTimeToHour(data.locs_hr_sat_cl),
      endMinute: convertTimeToMinute(data.locs_hr_sat_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_sat_cl),
    },
    sun: {
      isApplicable,
      schedule: data.locs_sun_status === '2' ? 'Closed' : 'Schedule',
      startHour: convertTimeToHour(data.locs_hr_sun_op),
      startMinute: convertTimeToMinute(data.locs_hr_sun_op),
      startPeriod: convertTimeToAmPm(data.locs_hr_sun_op),
      endHour: convertTimeToHour(data.locs_hr_sun_cl),
      endMinute: convertTimeToMinute(data.locs_hr_sun_cl),
      endPeriod: convertTimeToAmPm(data.locs_hr_sun_cl),
    },
  };

  return hoursOfOperation;
};

// Parse hours_of_operation from JSON string
const parseHoursOfOperation = (hoursString: any): any => {
  if (!hoursString) return null;
  
  try {
    // If it's already an object, return it
    if (typeof hoursString === 'object') return hoursString;
    
    // If it's a string, parse it
    if (typeof hoursString === 'string') {
      const parsed = JSON.parse(hoursString);
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing hours_of_operation:', error);
    return null;
  }
};

// Stringify hours_of_operation to JSON
const stringifyHoursOfOperation = (hoursObj: any): string => {
  try {
    if (typeof hoursObj === 'string') return hoursObj;
    return JSON.stringify(hoursObj);
  } catch (error) {
    console.error('Error stringifying hours_of_operation:', error);
    return '{}';
  }
};

// Convert time string like "08:00" to hour
const convertTimeToHour = (timeStr: string): string => {
  if (!timeStr || timeStr === '0') return '8';
  const parts = timeStr.split(':');
  return parts[0] ? String(parseInt(parts[0])) : '8';
};

// Convert time string like "08:00" to minute
const convertTimeToMinute = (timeStr: string): string => {
  if (!timeStr || timeStr === '0') return '00';
  const parts = timeStr.split(':');
  return parts[1] || '00';
};

// Convert time string to AM/PM
const convertTimeToAmPm = (timeStr: string): string => {
  if (!timeStr || timeStr === '0') return 'am';
  const hour = parseInt(convertTimeToHour(timeStr));
  return hour >= 12 ? 'pm' : 'am';
};

// Convert PHPFox hours format to our format
const convertOurFormatToPhpfox = (hoursOfOperation: any) => {
  const convertTo24Hour = (hour: string, period: string): string => {
    const h = parseInt(hour) || 8;
    const p = String(period || 'am').toLowerCase().trim();
    
    let hour24 = h;
    // Handle 12-hour to 24-hour conversion
    if (p === 'pm' && h !== 12) hour24 = h + 12;
    if (p === 'am' && h === 12) hour24 = 0;
    
    return String(hour24).padStart(2, '0');
  };

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const phpfoxData: any = {
    locs_hours_status: hoursOfOperation.mon?.isApplicable ? '1' : '0',
  };

  days.forEach((day) => {
    const dayData = hoursOfOperation[day];
    if (dayData) {
      phpfoxData[`locs_${day}_status`] = dayData.schedule === 'Closed' ? '1' : '0';
      
      // Safely extract and validate start time
      const startHour = String(dayData.startHour || '8').trim();
      const startMinute = String(dayData.startMinute || '00').padStart(2, '0');
      const startPeriod = String(dayData.startPeriod || 'am').toLowerCase().trim();
      
      // Safely extract and validate end time
      const endHour = String(dayData.endHour || '17').trim();
      const endMinute = String(dayData.endMinute || '00').padStart(2, '0');
      const endPeriod = String(dayData.endPeriod || 'pm').toLowerCase().trim();
      
      // Convert to 24-hour format
      const start24Hour = convertTo24Hour(startHour, startPeriod);
      const end24Hour = convertTo24Hour(endHour, endPeriod);
      
      const openTime = `${start24Hour}:${startMinute}`;
      const closeTime = `${end24Hour}:${endMinute}`;
      
      phpfoxData[`locs_hr_${day}_op`] = openTime;
      phpfoxData[`locs_hr_${day}_cl`] = closeTime;
    }
  });

  return phpfoxData;
};

interface HoursEntry {
  isApplicable: boolean;
  schedule: string;
  startHour: string;
  startMinute: string;
  startPeriod: string;
  endHour: string;
  endMinute: string;
  endPeriod: string;
}

interface HoursOfOperation {
  [day: string]: HoursEntry;
}

interface CompanyDataResponse {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  street: string;
  phone: string;
  mobile: string;
  fax: string;
  email: string;
  website: string;
  companyPhoto?: string;
  coverPhoto?: string;
  allowReviews: boolean;
  offersVeteranDiscounts: boolean;
  wheelchairAccessible: boolean;
  atmOnPremises: boolean;
  customersCanPlaceOrders: boolean;
  curbsideServiceProvided: boolean;
  deliveryServiceAvailable: boolean;
  acceptedPayment: string;
  provides: string;
  hoursOfOperation?: HoursOfOperation;
}

export async function GET(req: Request) {
  try {
	const axios = await createServerAxios();
	
	const { searchParams } = new URL(req.url);
    const business = searchParams.get("business");
    	
		
    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business is required',
        },
        { status: 400 }
      );
    }
	
	const response = await axios.get("/business/company", {
	  params: { business },
	});
	

    if (!response.data || response.data.status === 'error') {
      return NextResponse.json(
        {
          success: false,
          message: response.data?.message || 'Failed to fetch company data',
        },
        { status: 404 }
      );
    }

    const parsedHours = parseHoursOfOperation(response.data.data.hours_of_operation);

    // Transform PHPFox response to match frontend schema
    const companyData: CompanyDataResponse = {
      id: response.data.data.page_id,
      name: response.data.data.title || '',
      country: response.data.data.country || 'United States',
      state: response.data.data.country_child_id || '',
      city: response.data.data.locs_city || '',
      zipCode: response.data.data.locs_zip || '',
      street: response.data.data.locs_street || '',
      phone: formatPhoneNumber(response.data.data.locs_phone || ''),
      mobile: formatPhoneNumber(response.data.data.locs_mobile || ''),
      fax: formatPhoneNumber(response.data.data.locs_fax || ''),
      email: response.data.data.locs_email || '',
      website: response.data.data.info_website || '',
      companyPhoto: response.data.data.pages_image_path || '',
      coverPhoto: response.data.data.cover_photo_url || '',
      allowReviews: toBool(response.data.data.locs_enable_rating),
      offersVeteranDiscounts: toBool(response.data.data.locs_veteran),
      wheelchairAccessible: toBool(response.data.data.locs_wheelchair),
      atmOnPremises: toBool(response.data.data.locs_is_atm),
      customersCanPlaceOrders: toBool(response.data.data.customers_can_place_orders),
      curbsideServiceProvided: toBool(response.data.data.locs_accept_curbside),
      deliveryServiceAvailable: toBool(response.data.data.locs_accept_pickup),
      acceptedPayment: response.data.data.accepted_payment || 'cash',
      provides: response.data.data.locs_provides || '',
      hoursOfOperation: parsedHours || convertPhpfoxToOurFormat(response.data.data),
    };

    return NextResponse.json({
      success: true,
      data: companyData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch data" },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    await params; // Consume the params Promise
    const body = await request.json();
	const axios = await createServerAxios();
	
    const businessId = body.businessId || body.id;
    	
    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business ID is required',
        },
        { status: 400 }
      );
    }

    // Transform frontend schema to PHPFox schema
    const phpfoxPayload = {
      id: body.id,
      name: body.name,
      country: body.country,
      state: body.state,
      city: body.city,
      zip_code: body.zipCode,
      street: body.street,
      phone: unformatPhoneNumber(body.phone),
      mobile: unformatPhoneNumber(body.mobile),
      fax: unformatPhoneNumber(body.fax),
      email: body.email,
      website: body.website,
      allowReviews: toBool(body.allowReviews) ? '1' : '0',
      offersVeteranDiscounts: toBool(body.offersVeteranDiscounts) ? '1' : '0',
      wheelchairAccessible: toBool(body.wheelchairAccessible) ? '1' : '0',
      atmOnPremises: toBool(body.atmOnPremises) ? '1' : '0',
      customersCanPlaceOrders: toBool(body.customersCanPlaceOrders) ? '1' : '0',
      curbsideServiceProvided: toBool(body.curbsideServiceProvided) ? '1' : '0',
      deliveryServiceAvailable: toBool(body.deliveryServiceAvailable) ? '1' : '0',
      acceptedPayment: body.acceptedPayment,
      provides: body.provides,
      ...(body.hoursOfOperation && convertOurFormatToPhpfox(body.hoursOfOperation)),
	  hours_of_operation: body.hoursOfOperation || null,
    };

	
	const response = await axios.put(`/business/company`, phpfoxPayload);
	
    if (!response.data || response.data.status === 'error') {
      return NextResponse.json(
        {
          success: false,
          message: response.data?.message || 'Failed to update company data',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Company details updated successfully',
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to fetch data" },
      { status: error.response?.status || 500 }
    );
  }
}