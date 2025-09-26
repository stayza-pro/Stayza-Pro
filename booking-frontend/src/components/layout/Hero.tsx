"use client";

import React, { useState } from "react";
import { Button, Input } from "../ui";
import { Search, MapPin, Calendar, Users } from "lucide-react";

export const Hero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <div className="absolute inset-0 bg-black opacity-20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-100">
            Discover amazing places to stay around the world
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Location */}
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Where are you going?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-gray-900"
                />
              </div>

              {/* Check-in */}
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  placeholder="Check-in"
                  className="pl-10 text-gray-900"
                />
              </div>

              {/* Check-out */}
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  placeholder="Check-out"
                  className="pl-10 text-gray-900"
                />
              </div>

              {/* Guests */}
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Guests"
                  min="1"
                  className="pl-10 text-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={handleSearch}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Search className="h-5 w-5 mr-2" />
                Search Properties
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
