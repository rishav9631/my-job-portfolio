import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { contactusEndpoint } from "../services/apis";

const ContactUsForm = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm();

  const submitContactForm = async (data) => {
    try {
      setLoading(true);
      const res = await apiConnector(
        "POST",
        contactusEndpoint.CONTACT_US_API,
        data
      );

      if (res.data.success) {
        toast.success("Message sent successfully!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }

      setLoading(false);
      reset();
    } catch (error) {
      console.log("ERROR MESSAGE - ", error.message);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset({
        email: "",
        firstname: "",
        lastname: "",
        message: "",
        phoneNo: "",
        jobRole: "",
        jobLink: "",
      });
    }
  }, [reset, isSubmitSuccessful]);

  return (
    <div className="min-h-screen flex font-inter relative overflow-hidden">
      
      {/* Left Side - Hero Section (Transparent Background) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center z-10 px-12">
        <div className="relative w-full max-w-lg text-left">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg italic">
            Welcome to your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-teal-400 not-italic">
              Personalised Job Tracker
            </span>
          </h1>
          <p className="text-xl text-gray-300 drop-shadow-md">
            Your personal companion. Track and manage your job applications with ease.
          </p>

          {/* Floating Cards Decoration */}
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#10b981]/20 rounded-2xl rotate-12 backdrop-blur-sm border border-[#10b981]/20 animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>
      </div>

      {/* Right Side - Container for the Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <form
          className="w-full max-w-lg bg-[#111827]/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-[#1f2937]/50 flex flex-col gap-4"
          onSubmit={handleSubmit(submitContactForm)}
        >
          <h2 className="text-2xl font-bold text-center mb-1 text-[#10b981]">
            Contact Recipients
          </h2>

          {/* Recipient's Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="recipientName"
              className="text-sm font-medium text-gray-400"
            >
              Recipient's Name
            </label>
            <input
              type="text"
              id="recipientName"
              placeholder="Enter recipient's name"
              className="w-full p-2.5 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors outline-none"
              {...register("recipientName", {
                required: "Recipient's name is required.",
              })}
            />
            {errors.recipientName && (
              <span className="text-xs text-red-500">
                {errors.recipientName.message}
              </span>
            )}
          </div>

          {/* Recipient's Email */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="recipientEmail"
              className="text-sm font-medium text-gray-400"
            >
              Recipient's Email
            </label>
            <input
              type="email"
              id="recipientEmail"
              placeholder="Enter recipient's email"
              className="w-full p-2.5 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors outline-none"
              {...register("recipientEmail", {
                required: "Recipient's email is required.",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: "Invalid email address.",
                },
              })}
            />
            {errors.recipientEmail && (
              <span className="text-xs text-red-500">
                {errors.recipientEmail.message}
              </span>
            )}
          </div>

          {/* Recipient's Company */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="recipientCompany"
              className="text-sm font-medium text-gray-400"
            >
              Recipient's Company
            </label>
            <input
              type="text"
              id="recipientCompany"
              placeholder="Enter recipient's company"
              className="w-full p-2.5 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors outline-none"
              {...register("recipientCompany", {
                required: "Recipient's company is required.",
              })}
            />
            {errors.recipientCompany && (
              <span className="text-xs text-red-500">
                {errors.recipientCompany.message}
              </span>
            )}
          </div>

          {/* Job Role */}
          <div className="flex flex-col gap-1">
            <label htmlFor="jobRole" className="text-sm font-medium text-gray-400">
              Job Role
            </label>
            <input
              type="text"
              id="jobRole"
              placeholder="Enter job role"
              className="w-full p-2.5 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors outline-none"
              {...register("jobRole")}
            />
          </div>

          {/* Job Link */}
          <div className="flex flex-col gap-1">
            <label htmlFor="jobLink" className="text-sm font-medium text-gray-400">
              Job Link
            </label>
            <input
              type="url"
              id="jobLink"
              placeholder="Enter job link"
              className="w-full p-2.5 rounded-lg bg-[#1f2937]/50 text-white border border-[#374151] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors outline-none"
              {...register("jobLink")}
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={loading}
            type="submit"
            className={`w-full bg-[#059669] text-white font-bold py-2.5 mt-2 rounded-xl shadow-lg shadow-[#064e3b]/20 text-[15px] 
              ${
                !loading
                  ? "hover:bg-[#047857] transition-all transform hover:-translate-y-0.5"
                  : "opacity-50 cursor-not-allowed"
              }`}
          >
            Send Message
          </button>
        </form>
      </div>
      {loading && <div className="mx-auto spinner absolute top-4"></div>}
    </div>
  );
};

export default ContactUsForm;
