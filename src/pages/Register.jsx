import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Zap,
  Lock,
  Mail,
  User,
  Home as HomeIcon,
  MapPin,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { register as registerUser, clearError } from '../store/slices/authSlice';

const schema = yup.object().shape({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match'),
  homeName: yup.string().required('Home name is required'),
  address: yup.string().required('Address is required'),
  tariffRate: yup.number().positive('Tariff rate must be positive').required('Tariff rate is required'),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tariffRate: 5.5
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const nextStep = async () => {
    const fieldsToValidate = step === 1 ? ['name', 'email', 'password', 'confirmPassword'] : ['homeName', 'address', 'tariffRate'];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = (data) => {
    const { confirmPassword, ...submitData } = data;
    const userData = {
      name: submitData.name,
      email: submitData.email,
      password: submitData.password,
      homeData: {
        name: submitData.homeName,
        address: submitData.address,
        tariffRate: submitData.tariffRate
      }
    };
    dispatch(registerUser(userData));
  };

  const features = [
    'Real-time energy monitoring',
    'AI-powered insights',
    'Smart automation',
    'Cost savings tracking',
    'Environmental impact',
    'Community comparison'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left side - Branding */}
        <motion.div
          className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 p-12 flex-col justify-center text-white relative overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <motion.div
              className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Zap className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Start Saving Energy Today
            </motion.h1>

            <motion.p
              className="text-lg opacity-90 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Join thousands of homeowners reducing their energy bills with smart monitoring
            </motion.p>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Registration form */}
        <motion.div
          className="w-full lg:w-3/5 p-8 lg:p-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Progress indicator */}
            <motion.div
              className="flex items-center justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                  1
                </div>
                <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-slate-200'
                  }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                  2
                </div>
              </div>
            </motion.div>

            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {step === 1 ? 'Create Account' : 'Setup Your Home'}
              </h2>
              <p className="text-slate-600">
                {step === 1 ? 'Enter your personal information' : 'Configure your home energy settings'}
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    className="space-y-6"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Name field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('name')}
                          type="text"
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.name ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-2 text-sm text-error-600">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('email')}
                          type="email"
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.email ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-2 text-sm text-error-600">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.password ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-2 text-sm text-error-600">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Confirm Password field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.confirmPassword ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-error-600">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    className="space-y-6"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Home Name field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Home Name
                      </label>
                      <div className="relative">
                        <HomeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('homeName')}
                          type="text"
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.homeName ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="My Smart Home"
                        />
                      </div>
                      {errors.homeName && (
                        <p className="mt-2 text-sm text-error-600">{errors.homeName.message}</p>
                      )}
                    </div>

                    {/* Address field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('address')}
                          type="text"
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.address ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="Enter your home address"
                        />
                      </div>
                      {errors.address && (
                        <p className="mt-2 text-sm text-error-600">{errors.address.message}</p>
                      )}
                    </div>

                    {/* Tariff Rate field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Electricity Tariff Rate (₹ per kWh)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">₹</span>
                        <input
                          {...register('tariffRate')}
                          type="number"
                          step="0.01"
                          className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.tariffRate ? 'border-error-300 bg-error-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          placeholder="5.50"
                        />
                      </div>
                      {errors.tariffRate && (
                        <p className="mt-2 text-sm text-error-600">{errors.tariffRate.message}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        You can find this on your electricity bill. Default is ₹5.50/kWh
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="w-full bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-semibold hover:bg-slate-300 transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>Create Account</span>
                            <CheckCircle className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;